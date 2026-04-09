import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Renderless component that scrolls the viewport to the top
 * whenever the pathname changes (i.e. on navigation).
 * Must be rendered inside a Router context.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}