import { readFileSync } from "node:fs";

export default function Home() {
  const h = readFileSync(process.cwd() + "/public/landing-header.html", "utf8");
  const m = readFileSync(process.cwd() + "/public/landing-main.html", "utf8");
  const f = readFileSync(process.cwd() + "/public/landing-footer.html", "utf8");
  return (
    <>
      <header className="nav" dangerouslySetInnerHTML={{ __html: h }} />
      <main id="top" dangerouslySetInnerHTML={{ __html: m }} />
      <footer className="footer closing footer--dark ground-inverse" id="contact" aria-labelledby="close-h" dangerouslySetInnerHTML={{ __html: f }} />
    </>
  );
}

