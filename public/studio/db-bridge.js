/* ============================================================
   StudioDB — 스튜디오 앱(board/process)이 부모 셸을 통해 Supabase 에
   접근하기 위한 작은 RPC 브리지. 앱은 Supabase 클라이언트를 직접 갖지
   않고, postMessage 로 부모(React StudioShell)에 요청한다.

   사용:
     await StudioDB.list('play')                 -> {ok, rows:[{title,data}]}
     await StudioDB.get('play', '이름')           -> {ok, data}
     await StudioDB.upsert('play', '이름', {...})  -> {ok}
     await StudioDB.del('play', '이름')           -> {ok}
   StudioDB.enabled : 로그인 상태면 true (부모가 dbAuth 로 알려줌)
   'studiodb-auth' 이벤트 : 로그인 상태가 바뀌면 발생 (detail.enabled)
   ============================================================ */
(function () {
  var seq = 0
  var pend = {}

  function call(op, kind, title, data, withData) {
    return new Promise(function (resolve) {
      var reqId = ++seq
      pend[reqId] = resolve
      try {
        parent.postMessage(
          { type: 'db', op: op, kind: kind, title: title, data: data, withData: !!withData, reqId: reqId },
          '*'
        )
      } catch (e) {
        delete pend[reqId]
        resolve({ ok: false, error: 'bridge' })
        return
      }
      // 응답이 없으면(부모 없음 등) 6초 후 실패 처리 → 앱은 로컬로 폴백
      setTimeout(function () {
        if (pend[reqId]) {
          pend[reqId]({ ok: false, timeout: true })
          delete pend[reqId]
        }
      }, 6000)
    })
  }

  window.StudioDB = {
    enabled: false,
    list: function (kind, withData) {
      return call('list', kind, null, null, withData)
    },
    get: function (kind, title) {
      return call('get', kind, title)
    },
    upsert: function (kind, title, data) {
      return call('upsert', kind, title, data)
    },
    del: function (kind, title) {
      return call('delete', kind, title)
    },
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {}
    if (d.type === 'dbResult' && pend[d.reqId]) {
      pend[d.reqId](d)
      delete pend[d.reqId]
    } else if (d.type === 'dbAuth') {
      var was = window.StudioDB.enabled
      window.StudioDB.enabled = !!d.enabled
      if (was !== window.StudioDB.enabled) {
        try {
          window.dispatchEvent(
            new CustomEvent('studiodb-auth', { detail: { enabled: window.StudioDB.enabled } })
          )
        } catch (_) {}
      }
    }
  })
})()
