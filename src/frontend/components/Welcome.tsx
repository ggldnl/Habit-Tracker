export function Welcome() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            🏠 Welcome to Your Personal Hub
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your habits, organize your lists, and stay productive.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 border border-border rounded-lg bg-card hover:bg-muted transition-colors">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">📊 Habit Tracker</h3>
              <p className="text-muted-foreground">
                Build consistent habits with visual tracking. Mark your daily progress and watch your streaks grow.
              </p>
            </div>
          </div>
          
          <div className="p-6 border border-border rounded-lg bg-card hover:bg-muted transition-colors">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">📝 Lists</h3>
              <p className="text-muted-foreground">
                Organize your tasks with customizable lists. Check off completed items and stay on top of your goals.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Use the sidebar to navigate between different tools. Click the menu icon to toggle the sidebar visibility.
          </p>
        </div>
      </div>
    </div>
  );
}