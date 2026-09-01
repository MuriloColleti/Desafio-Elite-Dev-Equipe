interface Props {
  story: string;
}

export function EmDesenvolvimento({ story }: Props) {
  return (
    <section className="aviso">
      <h1>Tela da {story}</h1>
      <p>Em desenvolvimento.</p>
    </section>
  );
}
