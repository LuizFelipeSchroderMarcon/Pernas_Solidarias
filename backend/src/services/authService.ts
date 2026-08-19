import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AppError } from '../middlewares/errorHandler';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(email: string, senha: string) {
    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios.');
    }

    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const newUser = await this.userRepository.create(email, senhaHash);
    return {
      cd_user: newUser.cd_user,
      email: newUser.email,
      created_at: newUser.created_at,
    };
  }

  async login(email: string, senha: string) {
    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios.');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.senha) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const passwordMatch = await bcrypt.compare(senha, user.senha);
    if (!passwordMatch) {
      throw new AppError('Credenciais inválidas.', 401);
    }

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
