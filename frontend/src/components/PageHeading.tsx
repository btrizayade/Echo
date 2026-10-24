
type PageHeadingProps = {
  title: string;
  subtitle: string;
};

export default function PageHeading({
  title,
  subtitle,
}: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">UM ESPAÇO PARA EXPLORAR</p>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <span className="heading-doodle" aria-hidden="true">
        ✳
      </span>
    </div>
  );
}
