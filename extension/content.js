(() => {
  const status = (value, state = "available", reason = null) => ({ status: state, value, reason });
  const safe = (fn, fallback = null) => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  const attrs = (element) => Object.fromEntries(
    Array.from(element.attributes || []).map((attribute) => [attribute.name, attribute.value])
  );
  const metaElements = Array.from(document.querySelectorAll("meta")).map((element) => ({
    name: element.getAttribute("name"),
    property: element.getAttribute("property"),
    http_equiv: element.getAttribute("http-equiv"),
    charset: element.getAttribute("charset"),
    content: element.getAttribute("content"),
    attributes: attrs(element)
  }));
  const linkElements = Array.from(document.querySelectorAll("link")).map((element) => ({
    rel: Array.from(element.relList || []),
    href: element.href || null,
    hreflang: element.hreflang || null,
    type: element.type || null,
    media: element.media || null,
    sizes: element.sizes ? Array.from(element.sizes) : [],
    as: element.as || null,
    cross_origin: element.crossOrigin || null,
    referrer_policy: element.referrerPolicy || null,
    attributes: attrs(element)
  }));
  const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((element) => {
    const rawText = element.textContent || "";
    try {
      return { parse_status: "valid", value: JSON.parse(rawText), raw_text: rawText };
    } catch (error) {
      return { parse_status: "invalid", value: null, raw_text: rawText, error: String(error) };
    }
  });
  const getMeta = (key, attribute = "name") => metaElements
    .filter((item) => (item[attribute] || "").toLowerCase() === key.toLowerCase())
    .map((item) => item.content)
    .filter((value) => value !== null);
  const groupedPrefix = (prefix) => Object.fromEntries(
    metaElements
      .filter((item) => (item.property || item.name || "").toLowerCase().startsWith(prefix))
      .reduce((map, item) => {
        const key = item.property || item.name;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item.content);
        return map;
      }, new Map())
  );
  const root = document.documentElement;
  const body = document.body;
  const selection = safe(() => window.getSelection());
  const active = document.activeElement;
  const visualViewport = window.visualViewport;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((element) => ({
    level: Number(element.tagName.slice(1)),
    text: (element.innerText || element.textContent || "").trim(),
    id: element.id || null
  }));
  const mediaQueries = {
    prefers_color_scheme_dark: matchMedia("(prefers-color-scheme: dark)").matches,
    prefers_color_scheme_light: matchMedia("(prefers-color-scheme: light)").matches,
    prefers_reduced_motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    prefers_contrast_more: matchMedia("(prefers-contrast: more)").matches,
    pointer_coarse: matchMedia("(pointer: coarse)").matches,
    pointer_fine: matchMedia("(pointer: fine)").matches,
    hover_available: matchMedia("(hover: hover)").matches
  };
  const performanceEntries = safe(() => performance.getEntries().map((entry) => {
    const json = typeof entry.toJSON === "function" ? entry.toJSON() : {};
    return { entry_type: entry.entryType, name: entry.name, ...json };
  }), []);
  const imageElements = Array.from(document.images).map((image) => ({
    src: image.src || null,
    current_src: image.currentSrc || null,
    srcset: image.srcset || null,
    sizes: image.sizes || null,
    alt: image.alt || null,
    title: image.title || null,
    natural_width: image.naturalWidth,
    natural_height: image.naturalHeight,
    display_width: image.getBoundingClientRect().width,
    display_height: image.getBoundingClientRect().height,
    loading: image.loading || null,
    decoding: image.decoding || null,
    complete: image.complete
  }));
  const mediaElement = (element) => ({
    current_src: element.currentSrc || null,
    src: element.src || null,
    duration: Number.isFinite(element.duration) ? element.duration : null,
    current_time: element.currentTime,
    paused: element.paused,
    muted: element.muted,
    volume: element.volume,
    autoplay: element.autoplay,
    loop: element.loop,
    preload: element.preload || null,
    ready_state: element.readyState,
    network_state: element.networkState,
    poster: element.poster || null
  });
  const url = new URL(location.href);
  return {
    collected_at: new Date().toISOString(),
    page: status({
      name: document.title,
      title: document.title,
      url: location.href,
      canonical_urls: linkElements.filter((item) => item.rel.includes("canonical")).map((item) => item.href),
      favicon_candidates: linkElements.filter((item) => item.rel.some((rel) => rel.includes("icon"))).map((item) => item.href)
    }),
    url: status({
      href: url.href,
      origin: url.origin,
      protocol: url.protocol,
      username: url.username || null,
      password_present: Boolean(url.password),
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      query_parameters: Array.from(url.searchParams.keys()).reduce((output, key) => {
        output[key] = url.searchParams.getAll(key);
        return output;
      }, {}),
      hash: url.hash
    }),
    document: status({
      title: document.title,
      url: document.URL,
      document_uri: document.documentURI,
      base_uri: document.baseURI,
      referrer: document.referrer,
      domain: document.domain,
      content_type: document.contentType,
      character_set: document.characterSet,
      compat_mode: document.compatMode,
      ready_state: document.readyState,
      visibility_state: document.visibilityState,
      hidden: document.hidden,
      has_focus: document.hasFocus(),
      fullscreen: Boolean(document.fullscreenElement),
      picture_in_picture: Boolean(document.pictureInPictureElement),
      last_modified_reported: document.lastModified,
      language: root.lang || null,
      direction: root.dir || getComputedStyle(root).direction || null
    }),
    metadata: status({
      description: getMeta("description"),
      author: getMeta("author"),
      keywords: getMeta("keywords"),
      robots: getMeta("robots"),
      generator: getMeta("generator"),
      application_name: getMeta("application-name"),
      theme_color: getMeta("theme-color"),
      color_scheme: getMeta("color-scheme"),
      viewport: getMeta("viewport"),
      open_graph: groupedPrefix("og:"),
      twitter: groupedPrefix("twitter:"),
      all_meta_elements: metaElements
    }),
    links: status({ all_link_elements: linkElements }),
    structured_data: jsonLd.length ? status({ json_ld: jsonLd }) : status({ json_ld: [] }, "absent", "No JSON-LD elements were present."),
    viewport: status({
      inner_width_css_px: innerWidth,
      inner_height_css_px: innerHeight,
      outer_width_css_px: outerWidth,
      outer_height_css_px: outerHeight,
      device_pixel_ratio: devicePixelRatio,
      scroll_x: scrollX,
      scroll_y: scrollY,
      scroll_max_x: Math.max(0, (root?.scrollWidth || 0) - innerWidth),
      scroll_max_y: Math.max(0, (root?.scrollHeight || 0) - innerHeight),
      visual_viewport: visualViewport ? {
        width: visualViewport.width,
        height: visualViewport.height,
        scale: visualViewport.scale,
        offset_left: visualViewport.offsetLeft,
        offset_top: visualViewport.offsetTop,
        page_left: visualViewport.pageLeft,
        page_top: visualViewport.pageTop
      } : null
    }),
    screen: status({
      width: screen.width,
      height: screen.height,
      available_width: screen.availWidth,
      available_height: screen.availHeight,
      color_depth: screen.colorDepth,
      pixel_depth: screen.pixelDepth,
      orientation_type: screen.orientation?.type || null,
      orientation_angle: screen.orientation?.angle ?? null
    }),
    page_geometry: status({
      document_element: root ? {
        scroll_width: root.scrollWidth,
        scroll_height: root.scrollHeight,
        client_width: root.clientWidth,
        client_height: root.clientHeight,
        offset_width: root.offsetWidth,
        offset_height: root.offsetHeight
      } : null,
      body: body ? {
        scroll_width: body.scrollWidth,
        scroll_height: body.scrollHeight,
        client_width: body.clientWidth,
        client_height: body.clientHeight,
        offset_width: body.offsetWidth,
        offset_height: body.offsetHeight
      } : null
    }),
    page_structure: status({
      headings,
      heading_count: headings.length,
      element_counts: {
        links: document.links.length,
        images: document.images.length,
        forms: document.forms.length,
        scripts: document.scripts.length,
        stylesheets: document.styleSheets.length,
        videos: document.querySelectorAll("video").length,
        audio: document.querySelectorAll("audio").length,
        iframes: document.querySelectorAll("iframe").length,
        canvas: document.querySelectorAll("canvas").length,
        svg: document.querySelectorAll("svg").length,
        main: document.querySelectorAll("main,[role=main]").length,
        navigation: document.querySelectorAll("nav,[role=navigation]").length,
        header: document.querySelectorAll("header,[role=banner]").length,
        footer: document.querySelectorAll("footer,[role=contentinfo]").length,
        aside: document.querySelectorAll("aside,[role=complementary]").length
      }
    }),
    interaction_state: status({
      selected_text: selection ? String(selection) : "",
      selection_type: selection?.type || null,
      selection_range_count: selection?.rangeCount || 0,
      active_element: active ? {
        tag_name: active.tagName,
        id: active.id || null,
        class_names: Array.from(active.classList || []),
        role: active.getAttribute?.("role") || null,
        aria_label: active.getAttribute?.("aria-label") || null
      } : null
    }),
    media: status({
      images: imageElements,
      video: Array.from(document.querySelectorAll("video")).map(mediaElement),
      audio: Array.from(document.querySelectorAll("audio")).map(mediaElement)
    }),
    performance: status({
      time_origin: performance.timeOrigin,
      entries: performanceEntries
    }),
    environment: status({
      user_agent: navigator.userAgent,
      platform_reported: navigator.platform,
      languages: Array.from(navigator.languages || []),
      language: navigator.language,
      online: navigator.onLine,
      cookie_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack,
      hardware_concurrency: navigator.hardwareConcurrency ?? null,
      device_memory_gb_reported: navigator.deviceMemory ?? null,
      max_touch_points: navigator.maxTouchPoints,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezone_offset_minutes: new Date().getTimezoneOffset(),
      media_queries: mediaQueries,
      user_agent_data: navigator.userAgentData ? {
        mobile: navigator.userAgentData.mobile,
        platform: navigator.userAgentData.platform,
        brands: navigator.userAgentData.brands
      } : null
    })
  };
})();
