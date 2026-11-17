export default function Footer({ app }: { app?: boolean }) {
  return (
    <footer className={"footer closing footer--dark ground-inverse" + (app ? " footer--app" : "")} id="contact" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__links">
          <div className="grid">
            <div className="span-6">
              <a className="footer__mark" href="/"><span className="mark mark--initial" aria-hidden="true">A</span>AgentBoard</a>
              <p className="footer__lede">An open-source kanban board for people and AI agents.</p>
            </div>
            <div className="span-2 footer__col"><h3>Product</h3><ul><li><a href="/#product">Board</a></li><li><a href="/#features">Features</a></li><li><a href="/#flow">Review loop</a></li></ul></div>
            <div className="span-2 footer__col"><h3>Open source</h3><ul><li><a href="/#selfhost">Self-host</a></li><li><a href="https://github.com/KwanekDev/agentboard">Get the code</a></li><li><a href="https://github.com/KwanekDev/agentboard/blob/main/LICENSE">MIT license</a></li></ul></div>
            <div className="span-2 footer__col"><h3>Project</h3><ul><li><a href="/#faq">FAQ</a></li><li><a href="/board">The board</a></li></ul></div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 AgentBoard contributors</span>
            <span>Product names and logos are trademarks of their owners.</span>
            <div className="socials"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}

