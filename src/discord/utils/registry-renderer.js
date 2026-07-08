/**
 * Title: registry-renderer.js
 * Author: Tango Hunter
 * Date Created: 7/3/26
 * Description: Central documentation renderer for SYNARA.
 * For more details src/synara/docs/registry.json
 */

const fs = require("fs");
const path = require("path");

const { EmbedBuilder } = require("discord.js");

const DOCS_ROOT = path.join(__dirname, "..", "..", "synara", "docs");
const RELEASES_ROOT = path.join(DOCS_ROOT, "releases");
const REGISTRY_PATH = path.join(DOCS_ROOT, "registry.json");

/**
 * Standardized footer text.
 *
 * These values correspond to the footer
 * identifiers stored inside registry.json.
 */
const FOOTERS = {

    none: null,

    toggleable:
        "This feature may be enabled or disabled by server administrators.",

    automatic:
        "This feature operates automatically once configured.",

    interactive:
        "Members may use this feature at any time using the commands listed above.",

    configuration:
        "This describes an administrative configuration workflow."
};

/**
 * Reads registry.json from disk.
 *
 * @returns {Object}
 */
function loadRegistry() {

    const raw = fs.readFileSync(
        REGISTRY_PATH,
        "utf8"
    );

    return JSON.parse(raw);
}

/**
 * Returns the current SYNARA version.
 *
 * @returns {String}
 */
function getCurrentVersion() {

    const registry = loadRegistry();

    return registry.version;
}

/**
 * Finds a document by id.
 *
 * @param {String} id
 * @returns {Object|null}
 */
function getDocument(id) {

    const registry = loadRegistry();

    return registry.documents.find(
        document => document.id === id
    ) || null;
}

/**
 * Loads all documents.
 */
function getDocuments() {

    const registry =
        loadRegistry();

    return registry.documents;
}

/**
 * Loads a markdown document from disk.
 *
 * @param {String} id
 * @returns {String}
 */
function loadMarkdown(id) {

    const document = getDocument(id);

    if (!document) {

        throw new Error(
            `Unknown documentation id: ${id}`
        );
    }

    const markdownPath = path.join(
        DOCS_ROOT,
        document.path
    );

    return fs.readFileSync(
        markdownPath,
        "utf8"
    );
}

/**
 * Loads release metadata.
 *
 * @param {String} version
 * @returns {Object}
 */
function loadRelease(version) {

    const releasePath = path.join(
        RELEASES_ROOT,
        `${version}.json`
    );

    if (!fs.existsSync(releasePath)) {

        throw new Error(
            `Release ${version} not found.`
        );
    }

    return JSON.parse(
        fs.readFileSync(
            releasePath,
            "utf8"
        )
    );
}

/**
 * Returns footer text for a document.
 *
 * @param {String} footerId
 * @returns {String|null}
 */
function getFooter(footerId) {

    return FOOTERS[footerId] ?? null;
}

/**
 * Converts markdown into a Discord embed.
 *
 * Supported Markdown:
 *   # Heading
 *   ## Section
 *   Paragraphs
 *   - Bullet Lists
 * *
 * @param {String} markdown
 * @param {Object} document
 * @returns {EmbedBuilder}
 */
function parseMarkdown(markdown, document) {

    const embed = new EmbedBuilder()
        .setColor(0xCC3333); // Broadcast Red

    const lines = markdown.split(/\r?\n/);

    let currentSection = null;
    let currentContent = [];

    function flushSection() {

        if (!currentSection) {
            return;
        }

        embed.addFields({

            name: currentSection,

            value:
                currentContent.join("\n").trim() ||
                "\u200B"
        });

        currentContent = [];
    }

    for (const rawLine of lines) {

        const line = rawLine.trim();

        if (!line) {

            currentContent.push("");

            continue;
        }

        if (line.startsWith("# ")) {

            embed.setTitle(
                line.substring(2).trim()
            );

            continue;
        }

        if (line.startsWith("## ")) {

            flushSection();

            currentSection =
                line.substring(3).trim();

            continue;
        }

        currentContent.push(line);
    }

    flushSection();

    const footer = getFooter(
        document.footer
    );

    if (footer) {

        embed.setFooter({

            text: footer

        });
    }

    return embed;
}

/**
 * Renders a documentation
 * document by id.
 *
 * Returns both the registry
 * document metadata and the
 * rendered Discord embed.
 *
 * @param {String} id
 * @returns {{ document: Object, embed: EmbedBuilder }}
 */
function renderDocument(id) {

    const document = getDocument(id);

    if (!document) {

        throw new Error(
            `Unknown documentation id: ${id}`
        );
    }

    const markdown =
        loadMarkdown(id);

    const embed =
        parseMarkdown(
            markdown,
            document
        );

    return {

        document,

        embed

    };
}

/**
 * Renders every document
 * referenced by a release.
 *
 * The first embed contains
 * release information.
 *
 * @param {String} version
 * @returns {EmbedBuilder[]}
 */
function renderRelease(version) {

    const release =
        loadRelease(version);

    const embeds = [];

    const releaseEmbed =
        new EmbedBuilder()

            .setColor(0xCC3333)

            .setTitle(
                `SYNARA ${release.version} Update`
            )

            .setDescription(
                `## ${release.title}\n\n${release.type}`
            )
            
            .setFooter(
                `Automatic SYNARA Broadcast • Please Review the following update announcements.`
            );

    embeds.push(
        releaseEmbed
    );

    for (const document of release.documents) {

        const rendered =
            renderDocument(
                document.id
            );

        embeds.push(
            rendered.embed
        );
    }

    return embeds;
}

module.exports = {
    getCurrentVersion,
    getDocument,
    getDocuments,
    loadMarkdown,
    renderDocument,
    renderRelease
};
