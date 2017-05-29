/* extension.js
 *
 * Copyright (C) 2017 Felipe Borges <felipeborges@gnome.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const Lang = imports.lang;

const Gst = imports.gi.Gst;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;

const Main = imports.ui.main;
const Animation = imports.ui.animation;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const CurrentExtension = imports.misc.extensionUtils.getCurrentExtension();
const Manager = CurrentExtension.imports.manager;
const Sound = CurrentExtension.imports.sound;

Gst.init(null, 0);

const Popup = new Lang.Class({
    Name: 'Popup',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function() {
        this.parent({
            reactive: false,
            can_focus: false,
        });

        this.box = new St.BoxLayout({
            vertical: true,
        });
        this.actor.add(this.box);

        this.setLoading(true);

        this.manager = new Manager.Manager();
        this.manager.connect('sounds-loaded', this._onSoundsReady.bind(this));
    },

    setLoading: function(state) {
        if (!state) {
            this.spinner.actor.destroy();
            return;
        }

        let spinnerIcon = Gio.File.new_for_uri('resource:///org/gnome/shell/theme/process-working.svg');
        this.spinner = new Animation.AnimatedIcon(spinnerIcon, 16);
        this.spinner.play();

        this.box.add_child(this.spinner.actor);
    },

    _onSoundsReady: function() {
        this.setLoading(false);

        let sounds = this.manager.sounds;
        /* Add SoundBoxes two at the time */
        for (let idx = 0; idx < sounds.length; idx+=2) {
            let sound_box1 = new Sound.SoundBox (sounds[idx]);
            let line = new St.BoxLayout();
            line.add_child(sound_box1);

            if (sounds[idx+1]) {
                let sound_box2 = new Sound.SoundBox (sounds[idx+1]);
                line.add_child(sound_box2);
            }

            this.box.add_child(line);
        }
    }
});

const Button = new Lang.Class({
    Name: 'Button',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "Focusli");

        let box = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let icon = new St.Icon({
            icon_name: 'dialog-information-symbolic',
            style_class: 'system-status-icon'
        });
        box.add_child(icon);
        box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(box);

        let popup = new Popup();
        this.menu.addMenuItem(popup);
    },
});

function init() {
}

let button;

function enable() {
    button = new Button();
    Main.panel.addToStatusArea('focusli', button);
}

function disable() {
    button.destroy();
}
