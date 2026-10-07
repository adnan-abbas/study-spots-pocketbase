/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_436036380")

  // update collection data
  unmarshal({
    "listRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_436036380")

  // update collection data
  unmarshal({
    "listRule": "category = \"cafe\""
  }, collection)

  return app.save(collection)
})
