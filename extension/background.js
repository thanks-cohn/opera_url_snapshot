const api = globalThis.browser ?? globalThis.chrome;

function sanitizePageName(value) {
  const sanitized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "untitled-page";
}

function createPageNameFragment(sanitizedPageName) {
  if (sanitizedPageName.length <= 15) return sanitizedPageName;
  return `${sanitizedPageName.slice(0, 10)}-${sanitizedPageName.slice(-5)}`;
}

function filenameSafeTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "");
}

function compactDomain(urlValue) {
  try {
    return new URL(urlValue).hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown-host";
  } catch {
    return "unknown-host";
  }
}

function randomId() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function dataUrlFromText(text, mediaType) {
  return `data:${mediaType};charset=utf-8,${encodeURIComponent(text)}`;
}

async function setBadge(text, color) {
  await api.action.setBadgeBackgroundColor({ color });
  await api.action.setBadgeText({ text });
  if (text) setTimeout(() => api.action.setBadgeText({ text: "" }), 3500);
}

async function collectPageData(tabId) {
  try {
    const results = await api.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    return {
      status: "available",
      value: results?.[0]?.result ?? null,
      reason: null
    };
  } catch (error) {
    return {
      status: "restricted",
      value: null,
      reason: String(error)
    };
  }
}

async function detectLanguage(tabId) {
  try {
    const language = await api.tabs.detectLanguage(tabId);
    return { status: "available", value: language || null, reason: null };
  } catch (error) {
    return { status: "unavailable", value: null, reason: String(error) };
  }
}

async function capture() {
  await setBadge("…", "#666666");

  const capturedAt = new Date();
  const capturedAtIso = capturedAt.toISOString();
  const safeTimestamp = filenameSafeTimestamp(capturedAt);
  const directoryTimestamp = safeTimestamp;
  const uniqueId = randomId();

  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab was available.");

  const pageData = await collectPageData(tab.id);
  const detectedLanguage = await detectLanguage(tab.id);
  const originalTitle = pageData.value?.page?.value?.title || tab.title || "Untitled Page";
  const sanitizedTitle = sanitizePageName(originalTitle);
  const titleFragment = createPageNameFragment(sanitizedTitle);
  const domainFragment = compactDomain(tab.url || pageData.value?.page?.value?.url || "");
  const basename = `${safeTimestamp}-${titleFragment}-${domainFragment}-${uniqueId}`;
  const relativeDirectory = `url_snapshots/${directoryTimestamp}`;
  const imageFilename = `${basename}.png`;
  const metadataFilename = `${basename}.json`;

  let screenshotDataUrl = null;
  let screenshotStatus;
  try {
    screenshotDataUrl = await api.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    screenshotStatus = { status: "available", value: true, reason: null };
  } catch (error) {
    screenshotStatus = { status: "error", value: false, reason: String(error) };
  }

  const metadata = {
    schema: "url-viewport-snapshot/v1",
    snapshot_id: `uvs1-${safeTimestamp}-${uniqueId}`,
    captured_at: capturedAtIso,
    capture_method: "chromium-extension-visible-viewport",
    portability_mode: "downloads-directory-relative",
    output: {
      requested_relative_directory: relativeDirectory,
      note: "A browser extension can portably write beneath the configured Downloads directory. Arbitrary absolute paths require an optional Native Messaging helper."
    },
    naming: {
      original_page_name: originalTitle,
      sanitized_page_name: sanitizedTitle,
      first_10_characters: sanitizedTitle.length > 15 ? sanitizedTitle.slice(0, 10) : sanitizedTitle,
      last_5_characters: sanitizedTitle.length > 15 ? sanitizedTitle.slice(-5) : null,
      filename_page_fragment: titleFragment,
      domain_fragment: domainFragment,
      unique_id: uniqueId,
      basename
    },
    pairing: {
      basename,
      image_filename: imageFilename,
      metadata_filename: metadataFilename,
      relative_directory: relativeDirectory
    },
    screenshot: {
      ...screenshotStatus,
      filename: imageFilename,
      media_type: "image/png",
      capture_scope: "visible_viewport"
    },
    tab: {
      status: "available",
      value: {
        id: tab.id,
        window_id: tab.windowId,
        index: tab.index,
        title: tab.title || null,
        url: tab.url || null,
        pending_url: tab.pendingUrl || null,
        favicon_url: tab.favIconUrl || null,
        status: tab.status || null,
        active: tab.active,
        highlighted: tab.highlighted,
        pinned: tab.pinned,
        audible: tab.audible ?? null,
        muted_info: tab.mutedInfo || null,
        discarded: tab.discarded ?? null,
        auto_discardable: tab.autoDiscardable ?? null,
        incognito: tab.incognito,
        group_id: tab.groupId ?? null,
        detected_language: detectedLanguage
      },
      reason: null
    },
    page_observation: pageData
  };

  const downloads = [];
  if (screenshotDataUrl) {
    downloads.push(api.downloads.download({
      url: screenshotDataUrl,
      filename: `${relativeDirectory}/${imageFilename}`,
      saveAs: false,
      conflictAction: "uniquify"
    }));
  }

  downloads.push(api.downloads.download({
    url: dataUrlFromText(`${JSON.stringify(metadata, null, 2)}\n`, "application/json"),
    filename: `${relativeDirectory}/${metadataFilename}`,
    saveAs: false,
    conflictAction: "uniquify"
  }));

  await Promise.all(downloads);
  await setBadge(screenshotDataUrl ? "OK" : "JSON", screenshotDataUrl ? "#2e7d32" : "#b26a00");
}

api.action.onClicked.addListener(() => {
  capture().catch(async (error) => {
    console.error("URL Snapshot capture failed", error);
    await setBadge("ERR", "#b00020");
  });
});
