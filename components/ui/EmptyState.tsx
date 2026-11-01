import { BoxIcon } from "./Icons";

export default function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-field/60 bg-surface px-6 py-14 text-center" aria-live="polite">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
        <BoxIcon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>
      {children ? <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{children}</div> : null}
    </section>
  );
}
