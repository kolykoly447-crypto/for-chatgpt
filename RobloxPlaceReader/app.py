from __future__ import annotations

import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

APP_NAME = "Roblox Place Reader"
SUPPORTED = {".rbxlx", ".rbxmx"}


@dataclass
class PlaceNode:
    element: ET.Element
    class_name: str
    referent: str
    name: str
    properties: list[tuple[str, str, str]] = field(default_factory=list)
    children: list["PlaceNode"] = field(default_factory=list)


def compact_xml(element: ET.Element) -> str:
    """Convert a property value element to a compact, readable string."""
    if len(element) == 0:
        return (element.text or "").strip()
    parts: list[str] = []
    for child in element:
        value = compact_xml(child)
        if value:
            parts.append(f"{child.tag}={value}")
    return "; ".join(parts)


def read_properties(item: ET.Element) -> list[tuple[str, str, str]]:
    props = item.find("Properties")
    result: list[tuple[str, str, str]] = []
    if props is None:
        return result
    for value in list(props):
        prop_name = value.attrib.get("name", "(unnamed)")
        prop_type = value.tag
        result.append((prop_name, prop_type, compact_xml(value)))
    return result


def get_property(properties: list[tuple[str, str, str]], name: str) -> str:
    for prop_name, _kind, value in properties:
        if prop_name == name:
            return value
    return ""


def build_node(item: ET.Element) -> PlaceNode:
    class_name = item.attrib.get("class", "Unknown")
    referent = item.attrib.get("referent", "")
    properties = read_properties(item)
    name = get_property(properties, "Name") or class_name
    node = PlaceNode(item, class_name, referent, name, properties)
    for child in list(item):
        if child.tag == "Item":
            node.children.append(build_node(child))
    return node


def all_nodes(nodes: list[PlaceNode]):
    for node in nodes:
        yield node
        yield from all_nodes(node.children)


def load_place(path: Path) -> list[PlaceNode]:
    if path.suffix.lower() not in SUPPORTED:
        raise ValueError("This build reads XML place/model files (.rbxlx and .rbxmx). Binary .rbxl files are not supported.")
    # XML is parsed as data. Roblox script source is never executed.
    tree = ET.parse(path)
    root = tree.getroot()
    roots = [build_node(child) for child in list(root) if child.tag == "Item"]
    if not roots:
        raise ValueError("No Roblox Item entries were found. Check that this is a valid .rbxlx or .rbxmx file.")
    return roots


class RobloxPlaceReader:
    BG = "#11151c"
    PANEL = "#1a202b"
    PANEL_2 = "#202938"
    TEXT = "#e8edf5"
    MUTED = "#9aa8ba"
    ACCENT = "#58a6ff"
    BORDER = "#2d3848"

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(APP_NAME)
        self.root.geometry("1180x760")
        self.root.minsize(900, 580)
        self.root.configure(bg=self.BG)
        self.path: Optional[Path] = None
        self.roots: list[PlaceNode] = []
        self.tree_nodes: dict[str, PlaceNode] = {}
        self.next_tree_id = 0
        self.search_var = tk.StringVar()
        self.status_var = tk.StringVar(value="Open an .rbxlx or .rbxmx file to inspect its contents.")
        self.file_var = tk.StringVar(value="No place file loaded")
        self.count_var = tk.StringVar(value="0 INSTANCES  •  0 SCRIPTS")
        self._setup_style()
        self._build_menu()
        self._build_ui()
        self._show_welcome()

    def _setup_style(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("TFrame", background=self.BG)
        style.configure("Panel.TFrame", background=self.PANEL)
        style.configure("TLabel", background=self.BG, foreground=self.TEXT, font=("Segoe UI", 10))
        style.configure("Muted.TLabel", background=self.BG, foreground=self.MUTED, font=("Segoe UI", 9))
        style.configure("Header.TLabel", background=self.BG, foreground=self.TEXT, font=("Segoe UI Semibold", 19))
        style.configure("Section.TLabel", background=self.PANEL, foreground=self.TEXT, font=("Segoe UI Semibold", 10))
        style.configure("Accent.TButton", font=("Segoe UI Semibold", 9), padding=(12, 8))
        style.map("Accent.TButton", background=[("active", "#388bfd"), ("!disabled", self.ACCENT)], foreground=[("!disabled", "#071321")])
        style.configure("Treeview", background=self.PANEL, fieldbackground=self.PANEL, foreground=self.TEXT,
                        rowheight=25, borderwidth=0, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", background=self.PANEL_2, foreground=self.TEXT,
                        relief="flat", font=("Segoe UI Semibold", 9), padding=7)
        style.map("Treeview", background=[("selected", "#244b73")], foreground=[("selected", "#ffffff")])
        style.configure("TNotebook", background=self.PANEL, borderwidth=0)
        style.configure("TNotebook.Tab", background=self.PANEL_2, foreground=self.TEXT, padding=(12, 7))
        style.map("TNotebook.Tab", background=[("selected", self.PANEL)], foreground=[("selected", self.ACCENT)])

    def _build_menu(self):
        menu = tk.Menu(self.root, tearoff=False)
        file_menu = tk.Menu(menu, tearoff=False)
        file_menu.add_command(label="Open place/model…", command=self.open_file, accelerator="Ctrl+O")
        file_menu.add_command(label="Reload", command=self.reload_file)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.destroy)
        menu.add_cascade(label="File", menu=file_menu)
        help_menu = tk.Menu(menu, tearoff=False)
        help_menu.add_command(label="About", command=self.show_about)
        menu.add_cascade(label="Help", menu=help_menu)
        self.root.config(menu=menu)
        self.root.bind("<Control-o>", lambda _event: self.open_file())

    def _build_ui(self):
        header = tk.Frame(self.root, bg=self.BG)
        header.pack(fill="x", padx=22, pady=(18, 12))
        title_area = tk.Frame(header, bg=self.BG)
        title_area.pack(side="left", fill="x", expand=True)
        ttk.Label(title_area, text="Roblox Place Reader", style="Header.TLabel").pack(anchor="w")
        ttk.Label(title_area, text="READ-ONLY PLACE DATA INSPECTOR", style="Muted.TLabel").pack(anchor="w", pady=(2, 0))
        ttk.Button(header, text="Open place file", style="Accent.TButton", command=self.open_file).pack(side="right", padx=(10, 0))

        filebar = tk.Frame(self.root, bg=self.PANEL, highlightbackground=self.BORDER, highlightthickness=1)
        filebar.pack(fill="x", padx=22, pady=(0, 12))
        tk.Label(filebar, textvariable=self.file_var, bg=self.PANEL, fg=self.TEXT,
                 font=("Segoe UI", 9), anchor="w").pack(side="left", padx=12, pady=10, fill="x", expand=True)
        tk.Label(filebar, textvariable=self.count_var, bg=self.PANEL, fg=self.ACCENT,
                 font=("Segoe UI Semibold", 9)).pack(side="right", padx=12)

        content = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, bg=self.BG, sashwidth=6,
                                 sashrelief=tk.FLAT, bd=0, opaqueresize=True)
        content.pack(fill="both", expand=True, padx=22, pady=(0, 12))
        left = tk.Frame(content, bg=self.PANEL, highlightbackground=self.BORDER, highlightthickness=1)
        right = tk.Frame(content, bg=self.PANEL, highlightbackground=self.BORDER, highlightthickness=1)
        content.add(left, minsize=300, width=390)
        content.add(right, minsize=480)

        left_head = tk.Frame(left, bg=self.PANEL)
        left_head.pack(fill="x", padx=12, pady=(12, 8))
        tk.Label(left_head, text="PLACE HIERARCHY", bg=self.PANEL, fg=self.TEXT,
                 font=("Segoe UI Semibold", 10)).pack(anchor="w")
        search_row = tk.Frame(left, bg=self.PANEL)
        search_row.pack(fill="x", padx=12, pady=(0, 8))
        search = tk.Entry(search_row, textvariable=self.search_var, bg=self.PANEL_2, fg=self.TEXT,
                          insertbackground=self.TEXT, relief="flat", font=("Segoe UI", 10))
        search.pack(side="left", fill="x", expand=True, ipady=7, padx=(0, 7))
        search.bind("<Return>", lambda _event: self.apply_filter())
        tk.Button(search_row, text="Find", command=self.apply_filter, bg=self.PANEL_2, fg=self.TEXT,
                  activebackground=self.BORDER, activeforeground=self.TEXT, relief="flat",
                  padx=10, pady=6, cursor="hand2").pack(side="right")

        tree_frame = tk.Frame(left, bg=self.PANEL)
        tree_frame.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        self.hierarchy = ttk.Treeview(tree_frame, columns=("class",), show="tree headings", selectmode="browse")
        self.hierarchy.heading("#0", text="Name")
        self.hierarchy.heading("class", text="Class")
        self.hierarchy.column("#0", width=220, minwidth=120)
        self.hierarchy.column("class", width=110, minwidth=90, stretch=False)
        yscroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.hierarchy.yview)
        self.hierarchy.configure(yscrollcommand=yscroll.set)
        self.hierarchy.pack(side="left", fill="both", expand=True)
        yscroll.pack(side="right", fill="y")
        self.hierarchy.bind("<<TreeviewSelect>>", self.on_select)

        right_head = tk.Frame(right, bg=self.PANEL)
        right_head.pack(fill="x", padx=14, pady=(12, 8))
        self.selected_title = tk.Label(right_head, text="Nothing selected", bg=self.PANEL, fg=self.TEXT,
                                       font=("Segoe UI Semibold", 12), anchor="w")
        self.selected_title.pack(anchor="w")
        self.selected_subtitle = tk.Label(right_head, text="Choose an instance in the hierarchy", bg=self.PANEL,
                                           fg=self.MUTED, font=("Segoe UI", 9), anchor="w")
        self.selected_subtitle.pack(anchor="w", pady=(3, 0))

        self.tabs = ttk.Notebook(right)
        self.tabs.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        prop_tab = tk.Frame(self.tabs, bg=self.PANEL)
        script_tab = tk.Frame(self.tabs, bg=self.PANEL)
        self.tabs.add(prop_tab, text="Properties")
        self.tabs.add(script_tab, text="Script source (view only)")
        prop_wrap = tk.Frame(prop_tab, bg=self.PANEL)
        prop_wrap.pack(fill="both", expand=True, padx=4, pady=4)
        self.properties = ttk.Treeview(prop_wrap, columns=("type", "value"), show="headings")
        self.properties.heading("#1", text="Property")
        self.properties.heading("type", text="Type")
        self.properties.heading("value", text="Value")
        self.properties.column("#1", width=150, minwidth=110)
        self.properties.column("type", width=100, minwidth=75, stretch=False)
        self.properties.column("value", width=300, minwidth=120)
        pscroll = ttk.Scrollbar(prop_wrap, orient="vertical", command=self.properties.yview)
        self.properties.configure(yscrollcommand=pscroll.set)
        self.properties.pack(side="left", fill="both", expand=True)
        pscroll.pack(side="right", fill="y")

        self.source_text = tk.Text(script_tab, bg="#10151d", fg="#d8e2ef", insertbackground=self.TEXT,
                                   selectbackground="#244b73", relief="flat", wrap="none",
                                   font=("Consolas", 9), padx=10, pady=10)
        sy = ttk.Scrollbar(script_tab, orient="vertical", command=self.source_text.yview)
        sx = ttk.Scrollbar(script_tab, orient="horizontal", command=self.source_text.xview)
        self.source_text.configure(yscrollcommand=sy.set, xscrollcommand=sx.set, state="disabled")
        self.source_text.grid(row=0, column=0, sticky="nsew")
        sy.grid(row=0, column=1, sticky="ns")
        sx.grid(row=1, column=0, sticky="ew")
        script_tab.grid_rowconfigure(0, weight=1)
        script_tab.grid_columnconfigure(0, weight=1)

        footer = tk.Frame(self.root, bg=self.BG)
        footer.pack(fill="x", padx=22, pady=(0, 12))
        tk.Label(footer, textvariable=self.status_var, bg=self.BG, fg=self.MUTED,
                 font=("Segoe UI", 9), anchor="w").pack(fill="x")

    def _show_welcome(self):
        self.source_text.configure(state="normal")
        self.source_text.delete("1.0", "end")
        self.source_text.insert("1.0", "Script source appears here when you select a Script, LocalScript, or ModuleScript.\n\nThe source is displayed as text only; it is never run.")
        self.source_text.configure(state="disabled")

    def open_file(self):
        filename = filedialog.askopenfilename(
            title="Open Roblox XML place or model",
            filetypes=[("Roblox XML place/model", "*.rbxlx *.rbxmx"), ("All files", "*.*")],
        )
        if filename:
            self.load_path(Path(filename))

    def reload_file(self):
        if self.path:
            self.load_path(self.path)

    def load_path(self, path: Path):
        try:
            roots = load_place(path)
        except Exception as exc:
            messagebox.showerror("Could not read place file", str(exc))
            return
        self.path = path
        self.roots = roots
        flat = list(all_nodes(roots))
        script_count = sum(1 for n in flat if n.class_name in {"Script", "LocalScript", "ModuleScript"})
        self.count_var.set(f"{len(flat):,} INSTANCES  •  {script_count:,} SCRIPTS")
        self.file_var.set(str(path))
        self.status_var.set(f"Loaded {path.name} — read-only inspection; no place data was changed.")
        self.search_var.set("")
        self.populate_tree()
        self.clear_details()

    def populate_tree(self):
        self.hierarchy.delete(*self.hierarchy.get_children())
        self.tree_nodes.clear()
        self.next_tree_id = 0
        query = self.search_var.get().strip().casefold()

        def matches(node: PlaceNode) -> bool:
            own_match = not query or query in node.name.casefold() or query in node.class_name.casefold()
            return own_match or any(matches(child) for child in node.children)

        def insert_node(node: PlaceNode, parent_id: str = ""):
            if not matches(node):
                return
            self.next_tree_id += 1
            item_id = f"node_{self.next_tree_id}"
            self.tree_nodes[item_id] = node
            self.hierarchy.insert(parent_id, "end", iid=item_id,
                                  text=node.name, values=(node.class_name,))
            for child in node.children:
                insert_node(child, item_id)
        for node in self.roots:
            insert_node(node)

    def apply_filter(self):
        self.populate_tree()
        query = self.search_var.get().strip()
        if query:
            self.status_var.set(f"Showing instances matching ‘{query}’ and their parent paths.")
        elif self.path:
            self.status_var.set(f"Showing all instances in {self.path.name}.")

    def on_select(self, _event=None):
        selected = self.hierarchy.selection()
        if not selected:
            return
        node = self.tree_nodes.get(selected[0])
        if node:
            self.show_details(node)

    def clear_details(self):
        self.selected_title.config(text="Nothing selected")
        self.selected_subtitle.config(text="Choose an instance in the hierarchy")
        self.properties.delete(*self.properties.get_children())
        self._show_welcome()

    def show_details(self, node: PlaceNode):
        self.selected_title.config(text=node.name)
        suffix = f"  •  {node.referent}" if node.referent else ""
        self.selected_subtitle.config(text=f"{node.class_name}{suffix}  •  {len(node.children)} direct children")
        self.properties.delete(*self.properties.get_children())
        for prop_name, prop_type, value in node.properties:
            shown = value.replace("\n", " ⏎ ")
            if len(shown) > 500:
                shown = shown[:497] + "..."
            self.properties.insert("", "end", values=(prop_name, prop_type, shown))
        source = ""
        for prop_name, prop_type, value in node.properties:
            if prop_name == "Source" and prop_type == "ProtectedString":
                source = value
                break
        self.source_text.configure(state="normal")
        self.source_text.delete("1.0", "end")
        if node.class_name in {"Script", "LocalScript", "ModuleScript"}:
            self.source_text.insert("1.0", source if source else "No readable Source property was found in this file.")
        else:
            self.source_text.insert("1.0", "Select a Script, LocalScript, or ModuleScript to view its saved source text.\n\nNothing in this panel is executed.")
        self.source_text.configure(state="disabled")

    def show_about(self):
        messagebox.showinfo(
            "About Roblox Place Reader",
            "Roblox Place Reader 1.0\n\nA read-only viewer for local Roblox XML place/model files (.rbxlx and .rbxmx). It shows the instance hierarchy, saved properties, and script source as plain text.\n\nIt does not attach to Roblox Player, inspect process memory, connect to game servers, modify place files, or execute scripts.",
        )


def main():
    root = tk.Tk()
    RobloxPlaceReader(root)
    root.mainloop()


if __name__ == "__main__":
    main()
