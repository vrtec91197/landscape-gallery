import { version } from "../../package.json";

export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      <span>Landscape Gallery</span>
      <span className="mx-2">·</span>
      <span>v{version}</span>
    </footer>
  );
}
