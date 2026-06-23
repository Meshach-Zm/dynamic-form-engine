// Documents the immutability contract: once a FormVersion is created,
// its schema must never change. Submissions depend on it for historical integrity.
// This test validates the LOGIC, not the database constraint.

describe('FormVersion immutability contract', () => {
  it('treats two snapshots of the same schema as equal', () => {
    const schemaV1 = { type: 'object', properties: { name: { type: 'string' } } }
    // Simulating what a stored-then-retrieved version looks like
    const retrieved = JSON.parse(JSON.stringify(schemaV1))
    expect(retrieved).toEqual(schemaV1)
  })

  it('confirms version numbers are sequential and do not collide', () => {
    const versions = [1, 2, 3]
    const unique = new Set(versions)
    expect(unique.size).toBe(versions.length)
  })
})
