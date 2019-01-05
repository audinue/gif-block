(function () {
  var contextMenus = chrome.contextMenus
  var tabs = chrome.tabs
  var webRequest = chrome.webRequest

  var disabled = false
  var disabledTabs = {}

  var contexts = ['page_action']

  contextMenus.create({
    id: 'disabled',
    title: 'Disabled',
    type: 'checkbox',
    contexts: contexts,
    onclick: function (info) {
      disabled = info.checked
      tabs.reload()
    }
  })

  contextMenus.create({
    id: 'disabled_tab',
    title: 'Disabled on this tab',
    type: 'checkbox',
    contexts: contexts,
    onclick: function (info, tab) {
      if (info.checked) {
        disabledTabs[tab.id] = true
      } else {
        delete disabledTabs[tab.id]
      }
      tabs.reload()
    }
  })

  tabs.onActivated.addListener(function (info) {
    if (disabledTabs.hasOwnProperty(info.tabId)) {
      contextMenus.update('disabled_tab', { checked: true })
    } else {
      contextMenus.update('disabled_tab', { checked: false })
    }
  })

  tabs.onRemoved.addListener(function (tabId) {
    delete disabledTabs[tabId]
  })

  var result = { cancel: true }
  var filter = { urls: ['<all_urls>'] }

  webRequest.onBeforeRequest.addListener(function (details) {
    if (!disabled
        && !disabledTabs.hasOwnProperty(details.tabId)
        && details.url.substr(-4) === '.gif') {
      return result
    }
  }, filter, ['blocking'])

  webRequest.onHeadersReceived.addListener(function (details) {
    if (!disabled
        && !disabledTabs.hasOwnProperty(details.tabId)
        && shouldBeBlocked(details)) {
      return result
    }
  }, filter, ['blocking', 'responseHeaders'])

  function shouldBeBlocked (details) {
    if (details.url.substr(-4) === '.gif') {
      return true
    } else {
      var headers = details.responseHeaders
      for (var i = 0, length = headers.length; i < length; i++) {
        var field = headers[i]
        if (field.name.toLowerCase() === 'content-type'
            && field.value.indexOf('image/gif') > -1) {
          return true
        }
      }
      return false
    }
  }
}())
