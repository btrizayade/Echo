from app.models.capture import Capture
from app.models.theme import Theme


def test_capture_theme_relationship(db):
    capture = Capture(
        type="text",
        content="Uma ideia relacionada a memória.",
    )

    theme = Theme(
        name="Tema de relacionamento",
    )

    capture.themes.append(theme)

    db.add(capture)
    db.commit()
    db.refresh(capture)

    assert len(capture.themes) == 1
    assert capture.themes[0].name == "Tema de relacionamento"

    db.refresh(theme)

    assert len(theme.captures) == 1
    assert theme.captures[0].content == "Uma ideia relacionada a memória."
