
# BASHRC

![demo](https://github.com/cbrasser/bashrc/blob/master/demo_screen_newer.png)

## Running it

Needs a current node version (18+).

```
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build into dist/
```

The build output in `dist/` is completely static, so it can be dropped on any
web host (or used as a local start page via a `file://` url).

### Deploying to vercel

The repository ships a `vercel.json`, so there is nothing to configure: import
the repo on [vercel.com/new](https://vercel.com/new) and deploy. Vercel runs
`npm run build` and serves `dist/`. Pushes to `master` go to production, every
other branch gets a preview deployment.

From the command line it is:

```
npx vercel        # preview deployment
npx vercel --prod # production deployment
```

There is no backend and no environment variable to set: bookmarks, todos and
settings all live in the browser's local storage, and the weather applet talks
to open-meteo directly.

## Open issues
 - shortcuts for 'quitting' and opening applications


## Functionality

The basic principle of this startpage is to act as a bookmark repository.
...But in a very cool way.

This is a start page heavily inspired by my linux desktop setup, where I mainly operate in the terminal or terminal-based applications. Naturally, I'd like my browser startpage to be keyboard oriented as well. But it should also look nice.

Directories in the file system resemble bookmark categories and Files are named links to your webpages.

The Idea is to act like an os with a desktop environment, a file manager and open programs that are then arranged on the page trough a Window Manager (currently tiling or floating).

### Tiled

windows are arranged automatically to fill all available space (with sexy gaps, ofc)

### Floating

In the floating layout, you can arrange the windows by dragging and resizing them on their side borders.

 window locations and dimensions are stored in the config and should be persistent upon refreshing the page. This way you can arrange your windows in a way that you like.
 
Note: The window locations are absolute. Meaning that if you place a window on, e.g., the bottom-right corner on a big screen and then resize your screen the window might be out of the visible area. There are some checks to bring them back upon refreshing the page, but i did not test this too much :)


## Available programs

### shell

available commands:
- cd [path]: change directory
- ls [path]: list content of directory
- touch [path, url]: create file linking to [url]
- rm [path]: remove file
- mkdir [path]: create new directory
- rmdir [path]: remove directory
- fetch: cool system information
- echo [args]: print [args] to stdout
- pwd: print current working directory
- open [path]: open url of file at [path] in new tab
- locate [query]: search the query on duckduckgo
- help: list the available commands
- clear: clear stdout

Bookmark urls may be entered without a protocol, `https://` is added
automatically. Besides tab completion, the up and down arrow keys cycle through
the command history.

There is autocompletion for both commands and paths. you can invoke it by starting to type something and then hitting 'tab'. You can cycle through suggestions with tab and accept one with 'enter'. If there is only one suggestion, 'tab' will also work for accepting.


### filemanager

Modeled after the linux file manager 'fff' (fucking fast filemanager).
It is completely keyboard based.

#### controls

You can move up and down the content of the current directory with the arrow
keys or with 'j' and 'k'.
- Right arrow key (or 'l' or 'enter') either enters the selected item if its a directory or opens the url of the file if its a file.
- Left arrow key (or 'h') goes into the parent directory of the current dir
- input 'f' to add a new file
- input 'n' to add a new dir
- input '/' to search in the current dir
- input ':' to open a file/directory by typing its name
- input 'd' to go into 'deletion' mode: All (with 'd') selected elements will be deleted uppon pressing 'p'. Directories can only be deleted if they are empty.
- input 'esc' to leave the input prompt or deletion mode, if one of them is open or to cancel the filter applied by searching.

The status bar at the bottom displays the path of the current working directory as well as the position of the selected element and the currently active filter.

### weather 

Just a tiny applet that displays local weather information. you can set your
city in the settings widget. It uses the open-meteo api, which needs no
account and no api key.

###  todo

a tiny todo tracker. todos store a name and a description of a task, as well as
0 to several tags for marking tasks that belong to the same category (work, private,
university, some project, whatever). You can color-code the tags by clicking on them and selecting a color in the color strip.


### Settings

The wheel on the bottom right of the page opens the settings. you can select which applications you would like to have open upon startup as well as your preferred state of the window manager. You can also set your city for the weather applet and configure the colors, wallpaper, and window decorations to your likings!

The background image option needs to be a valid url of an image in oder to work. 
The colors currently only support hex values
The opacity needs to be a value from 0 to 1. 

The terminal and the file manager share their working directory, so navigating
in one of them moves the other one as well.

### Settings: reset

If a stored configuration ever ends up in a broken state, 'reset to defaults' at
the bottom of the settings panel puts everything back. Bookmarks are not
touched by this, they are stored separately.

### Active TODO list

- implement filetree widget

### General remarks

Links and dirs are clickable in all programs as well, but thats not the point of this website right?.

All bookmarks are currently stored in local storage, so you might now want to clear your cache if you stored a lot of bookmarks on the page. I am planning on porting the page into a chrome extension to get better storage options.

It should work with all modern browsers, however I'm mainly using firefox and can't guarantee that everything looks nicely on other browsers.

