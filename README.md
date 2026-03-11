# CBC Compilation Workbench

## About the Christmas Bird Count
The Christmas Bird Count is the nation's longest-running community science bird project.  
It occurs annually between December 14 and January 5 in more than 3000 count circles.  
More information is available on the [Audubon website](https://www.audubon.org/community-science/christmas-bird-count).

## About the tool
This tool was developed to help CBC compilers review and assemble eBird checklist exports directly in the browser by:
- Importing user-provided eBird CSV files locally
- Matching checklist locations to count circles, including the full historic circle index plus local overrides
- Summarizing counts, effort, coverage, and species totals in a compiler-focused workspace
- Supporting local-only edits and review state with IndexedDB persistence
- Comparing current results against bundled long-term CAPC historical data

The app is structured for static hosting and local browser-side use.

## Features
- Searchable count-circle picker with map zoom and local CAPC overrides
- Browser-side CSV import with no server-side upload requirement
- GeoJSON support for custom count circles
- Review panes for summary, species totals, checklist detail, and long-term plots
- IndexedDB persistence for local edits and session state
- Historic-style basemap and full count-circle catalog sourced from Audubon CBC geometry services

## How to use
1. Select a count circle from the search picker or load a custom GeoJSON circle.
2. Upload an eBird CSV export.
3. Review the compiled results, effort summaries, map output, and long-term comparison plot.
4. Adjust local review state as needed; changes remain in your browser storage.

## Privacy model
- Uploaded CSV files stay in the browser session unless you explicitly export data yourself.
- Local edits are stored in IndexedDB on your machine.
- No backend service is required for normal use.

## Development
```bash
npm install
npm run dev
```

## Production build
```bash
npm install
npm run build
npm run preview
```

## Deployment notes
- `public/data/CAPC_CBC_1971_2025_v2.csv` powers the long-term CAPC plot
- `public/data/capc_count_circle_areas.geojson` provides the CAPC local geometry override
- Count-circle search metadata is merged with remote historic circle data at runtime
- Taxonomy and ordering files live in `public/`
- `public/MyEBirdData.csv` is intentionally excluded from source control

If `public/MyEBirdData.csv` is absent, the app starts empty and waits for a CSV upload.

## Release workflow
For local pushes, a gitignored `pushit.sh` helper can bump the version and push a tagged release.

- Patch-sized update: `./pushit.sh --patch "message"`
- Minor update: `./pushit.sh --minor "message"`
- Major update: `./pushit.sh --major "message"`
- Explicit version: `./pushit.sh --release 0.1.0 "message"`

## Support this project
If you find this tool useful, please consider supporting its development:

<a href="https://buymeacoffee.com/bartg">
	<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" width="180" />
</a>
