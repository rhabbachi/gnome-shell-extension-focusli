/* manager.js
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

const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const CurrentExtension = imports.misc.extensionUtils.getCurrentExtension();
const { log, debug } = CurrentExtension.imports.log;

const SOUNDS_BASE_PATH = CurrentExtension.dir.get_child('sounds').get_path();
const SOUNDS_CACHE_PATH = GLib.build_filenamev([SOUNDS_BASE_PATH, "cached"]);
const SOUNDS_DB_PATH = GLib.build_filenamev([SOUNDS_BASE_PATH, "database.json"]);

const Manager = new Lang.Class({
    Name: 'Manager',
    Extends: GObject.Object,
    Signals: {
        'sounds-loaded': {},
    },

    _init: function() {
        this.parent();

        this.loadSounds();
    },

    loadSounds: function() {
        // Init the variables and parse the database.json file.
        let database_file = Gio.File.new_for_path(SOUNDS_DB_PATH);

        database_file.load_contents_async(null, (file, res) => {
            let contents;
            try {
                contents = database_file.load_contents_finish(res)[1].toString();
                this.sounds = JSON.parse(contents)['sounds'];

                this.sounds.forEach(Lang.bind(this, function(sound) {
                    if (!this.soundExists(sound)) {
                        this._downloadSound(sound);
                    }
                }));

                this.emit('sounds-loaded');
            } catch (e) {
                log("loadSounds - " + e);
            }
        });
    },

    _downloadSound: function(sound) {
        let stream = Gio.File.new_for_uri(sound.uri);

        log(stream.get_uri_scheme());

        stream.read_async(GLib.PRIORITY_DEFAULT,
            null,
            function(src,res) {
                let inputStream;
                try {
                    inputStream = stream.read_finish(res);
                } catch(e) {
                    log("_downloadSound - read_async - " + e);
                    return;
                }

                let destination_path = soundCachePath(sound);
                let destination_file = Gio.File.new_for_path(destination_path);
                // Make sure the destination dir is created.
                GLib.mkdir_with_parents(destination_path, 755);

                // Download the file to cache.
                destination_file.replace_async(null,
                    false,
                    Gio.FileCreateFlags.NONE,
                    GLib.PRIORITY_DEFAULT,
                    null,
                    Lang.bind(this, function(src, res) {
                        let outputStream = destination_file.replace_finish(res);

                        outputStream.splice_async(inputStream,
                            Gio.OutputStreamSpliceFlags.CLOSE_SOURCE | Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
                            GLib.PRIORITY_DEFAULT,
                            null,
                            Lang.bind(this, function(src, res) {
                                try {
                                    outputStream.splice_finish(res);
                                } catch (e) {
                                    log("_downloadSound - splice_async - " + e);
                                    return;
                                }
                            }));
                    }));
            });
    },

    soundExists: function(sound) {
        let path = soundCachePath(sound);
        let file = Gio.File.new_for_path(path);
        return file.query_exists(null);
    },

});

function soundCachePath(sound) {
    return GLib.build_filenamev([SOUNDS_CACHE_PATH, sound.name]);
}
