import Link from "next/link";

export default function DonateSuccessPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Thank you for your donation!</h1>
      <p className="text-muted-foreground">
        Your support means a lot and helps keep the gallery running.
      </p>
      <Link
        href="/"
        className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-foreground"
      >
        Back to Gallery
      </Link>
    </div>
  );
}
