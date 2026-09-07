import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AppError } from '../middlewares/errorHandler';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(email: string, password: string) {
    if (!email || !password) {
      throw new AppError('E-mail e senha são obrigatórios.');
    }

    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.userRepository.create(email, passwordHash);
    return {
      cd_user: newUser.cd_user,
      email: newUser.email,
      created_at: newUser.created_at,
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError('E-mail e senha são obrigatórios.');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.senha) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Check brute-force lockout (FA01 / RNF04)
    if (user.bloqueado_ate) {
      const lockUntil = new Date(user.bloqueado_ate);
      const now = new Date();
      if (now < lockUntil) {
        const remainingMinutes = Math.ceil((lockUntil.getTime() - now.getTime()) / (1000 * 60));
        throw new AppError(
          `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${remainingMinutes} minuto(s).`,
          429
        );
      }
    }

    const passwordMatch = await bcrypt.compare(password, user.senha);
    if (!passwordMatch) {
      const updatedUser = await this.userRepository.incrementFailedAttempts(user.cd_user);
      const attempts = updatedUser.tentativas_falhas || 1;
      if (attempts >= 5) {
        throw new AppError(
          'Acesso bloqueado por 15 minutos após 5 tentativas consecutivas incorretas.',
          429
        );
      }
      throw new AppError(
        `Credenciais inválidas. Tentativa ${attempts} de 5 antes do bloqueio temporário.`,
        401
      );
    }

    // Reset failed attempts on success
    await this.userRepository.resetFailedAttempts(user.cd_user);

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user.cd_user, email: user.email },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    return {
      user: {
        cd_user: user.cd_user,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    return user;
  }
}
