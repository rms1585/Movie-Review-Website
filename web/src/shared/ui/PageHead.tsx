type PageHeadProps = {
  title: string;
  lede?: string;
};

export function PageHead({ title, lede }: PageHeadProps) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {lede && <p className="page-head__lede">{lede}</p>}
    </div>
  );
}
