CREATE TABLE IF NOT EXISTS "USER" (
    cd_user SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS EVENTO (
    cd_evento SERIAL PRIMARY KEY,
    nm_evento VARCHAR(255) NOT NULL,
    dt_evento DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS CADEIRANTE (
    cd_cadeirante SERIAL PRIMARY KEY,
    nm_cadeirante VARCHAR(255) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    tam_camisa VARCHAR(5) NOT NULL,
    possui_cadeira_propria BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS CONDUTOR (
    cd_condutor SERIAL PRIMARY KEY,
    nm_condutor VARCHAR(255) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    tam_camisa VARCHAR(5) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS DUPLA (
    cd_dupla SERIAL PRIMARY KEY,
    cd_evento INT NOT NULL REFERENCES EVENTO(cd_evento) ON DELETE CASCADE,
    cd_cadeirante INT NOT NULL REFERENCES CADEIRANTE(cd_cadeirante) ON DELETE RESTRICT,
    cd_condutor INT NOT NULL REFERENCES CONDUTOR(cd_condutor) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_dupla_evento_cadeirante UNIQUE (cd_evento, cd_cadeirante),
    CONSTRAINT unq_dupla_evento_condutor UNIQUE (cd_evento, cd_condutor)
);


CREATE INDEX idx_dupla_evento ON public.dupla(cd_evento);
CREATE INDEX idx_dupla_cadeirante ON public.dupla(cd_cadeirante);
CREATE INDEX idx_dupla_condutor ON public.dupla(cd_condutor);