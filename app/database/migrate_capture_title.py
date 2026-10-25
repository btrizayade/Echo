
from sqlalchemy import inspect, text

from app.database.database import engine


def migrate_capture_title() -> None:
    """Add the title column and backfill existing captures."""

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = inspector.get_table_names()

        if "captures" not in tables:
            raise RuntimeError(
                "A tabela 'captures' não foi encontrada. "
                "Verifique o banco de dados configurado e "
                "execute este script na raiz do projeto Echo."
            )

        columns = {
            column["name"]
            for column in inspector.get_columns("captures")
        }

        if "title" not in columns:
            connection.execute(
                text(
                    """
                    ALTER TABLE captures
                    ADD COLUMN title VARCHAR(180) NOT NULL DEFAULT ''
                    """
                )
            )
            print("Coluna 'title' adicionada.")
        else:
            print("A coluna 'title' já existe.")

        result = connection.execute(
            text(
                """
                UPDATE captures
                SET title = CASE
                    WHEN TRIM(content) <> ''
                        THEN SUBSTR(TRIM(content), 1, 180)
                    WHEN type = 'image'
                        THEN 'Captura de imagem'
                    ELSE 'Captura de áudio'
                END
                WHERE title IS NULL OR TRIM(title) = ''
                """
            )
        )

        print(
            f"Títulos preenchidos: {result.rowcount}"
        )

    print("Migração concluída.")


if __name__ == "__main__":
    migrate_capture_title()
