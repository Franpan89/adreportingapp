export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">{{APP_NAME}}</h1>
      <p className="text-muted-foreground">{{APP_DESCRIPTION}}</p>
    </main>
  );
}
