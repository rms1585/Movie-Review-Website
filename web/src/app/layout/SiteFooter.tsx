import { Logo } from "../../shared/ui/Logo";
import { AppLink, useNavigation } from "../router/navigation";

export function SiteFooter() {
  const { navigate } = useNavigation();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__credit">
          <Logo onNavigate={navigate} size="footer" />
          {/* TMDB's attribution notice is required wording (SPEC §4). Their
              logo joins it in Phase 2, from TMDB's own brand files. */}
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="site-footer__links">
            <li><AppLink className="nav-link" to="/about">About</AppLink></li>
            <li><AppLink className="nav-link" to="/terms">Terms</AppLink></li>
            <li><AppLink className="nav-link" to="/privacy">Privacy</AppLink></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
