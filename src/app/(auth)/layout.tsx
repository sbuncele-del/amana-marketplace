export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages use their own layout without Navbar/Footer
  return <>{children}</>;
}
