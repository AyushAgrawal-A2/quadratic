import chalk from "chalk";
import { createScreen } from "./terminal.js";
const SPACE = "     ";
const DONE = "✓";
const BROKEN = "✗";
const WORKING_CHARACTERS = ["◐", "◓", "◑", "◒"];
const WATCH = "👀";
const ANIMATION_INTERVAL = 100;
const COMPONENTS = {
    client: { color: "magenta", name: "React", shortcut: "r" },
    api: { color: "blue", name: "API", shortcut: "a" },
    core: { color: "cyan", name: "Core", shortcut: "c" },
    multiplayer: { color: "green", name: "Multiplayer", shortcut: "m" },
    files: { color: "yellow", name: "Files", shortcut: "f" },
    types: { color: "magenta", name: "Types", shortcut: "t" },
    db: { color: "gray", name: "Database", shortcut: "d", hide: true },
    npm: { color: "gray", name: "npm install", shortcut: "n", hide: true },
    rust: { color: "gray", name: "rustup upgrade", shortcut: "r", hide: true },
};
export class UI {
    cli;
    control;
    spin = 0;
    help = false;
    // keep track of cursor when drawing the menu
    showing = false;
    characters = 0;
    lines = 0;
    constructor(cli, control) {
        this.cli = cli;
        this.control = control;
        setInterval(() => {
            this.spin = (this.spin + 1) % WORKING_CHARACTERS.length;
            if (this.showing) {
                this.clear();
                this.prompt();
            }
        }, ANIMATION_INTERVAL);
        createScreen();
    }
    clear() {
        if (this.showing) {
            // reset the current line
            process.stdout.clearLine(0);
            this.characters = 0;
            for (let i = 0; i < this.lines; i++) {
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine(0);
            }
            this.lines = 0;
            // move cursor to start of line
            process.stdout.cursorTo(0);
            this.showing = false;
        }
    }
    write(text, color, underline) {
        if (underline) {
            process.stdout.write(color ? chalk[color].underline(text) : chalk.underline(text));
        }
        else {
            process.stdout.write(color ? chalk[color](text) : text);
        }
        const width = process.stdout.getWindowSize()[0];
        // let c = this.characters;
        // use an array to turn utf8 characters into 1 character
        for (const char of [...text]) {
            if (char === "\n") {
                this.lines++;
                this.characters = 0;
            }
            else {
                this.characters++;
            }
            if (this.characters === width) {
                this.lines++;
                this.characters = 0;
            }
        }
        // process.stdout.write(`\n${JSON.stringify(text)} (${this.characters - c})`);
    }
    statusItem(component, alwaysWatch) {
        const error = this.control.status[component] === "x";
        const { name, color, shortcut } = COMPONENTS[component];
        const index = name.toLowerCase().indexOf(shortcut.toLowerCase());
        const writeColor = error ? "red" : color;
        this.write(name.substring(0, index), writeColor);
        this.write(name[index], writeColor, true);
        this.write(name.substring(index + 1), writeColor);
        if (this.control.status[component] === "x") {
            this.write(" " + BROKEN, "red");
        }
        else if (!this.control.status[component]) {
            this.write(" " + WORKING_CHARACTERS[this.spin], "gray");
        }
        else if (this.cli.options[component] || alwaysWatch) {
            this.write(" " + WATCH, "gray");
        }
        else {
            this.write(" " + DONE, "green");
        }
        this.write(SPACE);
    }
    print(component, text = "starting...") {
        this.clear();
        const { name, color } = COMPONENTS[component];
        process.stdout.write(`[${chalk[color](name)}] ${text}\n`);
        this.prompt();
    }
    prompt() {
        this.clear();
        this.write("\n");
        this.write("Quadratic Dev", "underline");
        this.write(SPACE);
        this.statusItem("client", true);
        this.statusItem("api");
        this.statusItem("core");
        this.statusItem("multiplayer");
        this.statusItem("files");
        this.statusItem("types");
        if (this.help) {
            this.write("(press t to toggle types | c to (un)watch core | a to (un)watch API | m to (un)watch multiplayer | f to (un)watch files | p to toggle perf for core | h to toggle help | q to quit)");
        }
        else {
            this.write(` (press h for help | q to quit)`);
        }
        this.showing = true;
    }
    printOutput(name, callback) {
        const command = this.control[name];
        const { color, hide } = COMPONENTS[name];
        command.stdout.on("data", (data) => {
            if (hide) {
                if (callback) {
                    callback(data);
                }
            }
            else {
                this.clear();
                process.stdout.write(`[${chalk[color](name)}] ${chalk[color](data)}`);
                this.prompt();
                if (callback) {
                    this.clear();
                    callback(data);
                    this.prompt();
                }
            }
        });
        command.stderr.on("data", (data) => {
            if (hide) {
                if (callback) {
                    callback(data);
                }
            }
            else {
                this.clear();
                process.stdout.write(`[${chalk[color](name)}] ${chalk.red(data)}`);
                this.prompt();
                if (callback) {
                    this.clear();
                    callback(data);
                    this.prompt();
                }
            }
        });
    }
    showHelp() {
        this.help = !this.help;
        this.clear();
        this.prompt();
    }
}
