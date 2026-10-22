import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Right-aligned content in the header (chips, legend, buttons). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, subtitle, icon, actions, children, className = "" }: Props) {
  return (
    <section className={`panel ${className}`.trim()}>
      <header className="panel__head">
        <div className="panel__heading">
          {icon && <span className="panel__icon" aria-hidden="true">{icon}</span>}
          <div>
            <h2 className="panel__title">{title}</h2>
            {subtitle && <p className="panel__subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="panel__actions">{actions}</div>}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
