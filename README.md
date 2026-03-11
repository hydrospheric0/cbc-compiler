# CBC Compilation Workbench

## About the Christmas Bird Count
The Christmas Bird Count is the nation's longest-running community science bird project.  
It occurs annually between December 14 and January 5 in more than 3000 count circles.  
More information is available on the [Audubon website](https://www.audubon.org/community-science/christmas-bird-count).

## About the tool
This tool was developed to help CBC compilers review their count data from their eBird record for the day.
The tool presumes that the count was fully conducted in eBird and all checklist for teh day were shared with your compiler account.

The app is structured for static hosting and local browser-side use. This means that the data re not saved anywhere els, othe rthan the compiler's computer.

The tool can be accessed at:
https://hydrospheric0.github.io/cbc-compiler/

## Features
- Select CBC count circle are and plot the locations of all eBird checklist.
- Select species specific recors so you easily see records of the same species within close proximity. e.g. Osprey.
- Directly open checklists and make adjustments.

## How to use
1. Select count circle.
2. Upload eBird list.
3. Review.
4. Download and share compiled list to csv.

## Privacy model
- Uploaded CSV files stay in the browser session unless you explicitly export data yourself.
- Local edits are stored in Indexed DB on your machine.
- No backend service is required for normal use.
- When browser history is purged all temporary files related to the compilation are as well.

### Support this project
If you find this tool useful, please consider supporting its development:

<a href="https://buymeacoffee.com/bartg">
	<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" width="180" />
</a>
