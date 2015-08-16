process.on('uncaughtException', (e)->
  console.trace(e)
  process.exit(1)
  )
