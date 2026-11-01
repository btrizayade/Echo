from sqlalchemy import Engine, inspect, text


def run_migrations(engine: Engine) -> None:
    """
    Executa migracoes pendentes do banco de dados.
    As migracoes podem ser executadas novamente sem duplicar colunas.
    """

    inspector = inspect(engine)

    if "captures" not in inspector.get_table_names():
        return

    capture_columns = {
        column["name"]
        for column in inspector.get_columns("captures")
    }

    if "is_favorite" not in capture_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE captures
                    ADD COLUMN is_favorite BOOLEAN
                    NOT NULL DEFAULT 0
                    """
                )
            )

        print("Migration applied: captures.is_favorite")