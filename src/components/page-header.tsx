type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">{title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-7 text-[var(--muted)]">{description}</p>
    </header>
  );
}
