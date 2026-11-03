import { Logo } from "../../shared/ui/Logo";
import { AppLink, useNavigation } from "../router/navigation";
import { AccountButton } from "./AccountButton";
import { SearchBar } from "./SearchBar";

export function SiteHeader() {
  const { navigate } = useNavigation();

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__bar">
          <Logo onNavigate={navigate} />
          <nav aria-label="Main" className="site-nav">
            <AppLink className="nav-link site-nav__home" to="/">Home</AppLink>
            <AppLink className="nav-link" matchExact={false} to="/browse">Browse</AppLink>
          </nav>
          <div className="site-header__search">
            <SearchBar />
          </div>
          <div className="site-header__account">
            <AccountButton />
          </div>
        </div>
        {/* Phones get search on its own row (design.md §7.5); CSS shows one
            of the two bars at a time, so only one is ever focusable. */}
        <div className="site-header__search-row">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
