const cache: Record<PropertyKey, any> = {}

export const add = (key: PropertyKey, value: any, timeToLive = 120) => {
  cache[key] = value
  setTimeout(() => {
    remove(key)
  }, timeToLive * 1000)
}

export const get = (key: PropertyKey) => {
  if(Object.hasOwn(cache, key)) {
    return cache[key]
  }
  return null
}

export const remove = (key: PropertyKey) => {
  delete cache[key]
}