export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 prose prose-slate">
      <h1 className="text-4xl font-extrabold text-slate-900">Disclaimer</h1>
      <p className="text-lg text-slate-600">
        Last updated: {new Date().toLocaleDateString()}
      </p>
      <div className="space-y-6 text-slate-700">
        <p>
          This website (GridHint.com) is an independent word-game helper and solver website.
        </p>
        <p>
          <strong>No Affiliation:</strong> GridHint.com is not affiliated with, sponsored by, or endorsed by The New York Times Company, Wordle, Connections, Spelling Bee, or any other puzzle publisher or game creator.
        </p>
        <p>
          <strong>Trademarks:</strong> All trademarks, service marks, trade names, trade dress, product names, and logos appearing on the site are the property of their respective owners. Any rights not expressly granted herein are reserved.
        </p>
        <p>
          <strong>Educational and Entertainment Purposes:</strong> The tools, hints, solvers, and word lists provided on this website are intended solely for educational and entertainment purposes. We do not provide "official" answers or guarantee the accuracy, completeness, or usefulness of any information on the site.
        </p>
        <p>
          By using this website, you agree to these terms and acknowledge that GridHint.com operates independently from the creators of the word games it provides utilities for.
        </p>
      </div>
    </div>
  );
}
