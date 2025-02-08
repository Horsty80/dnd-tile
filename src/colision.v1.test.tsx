import { describe, expect, test } from "vitest";
import { expandEntryToTheRight, updatePositionToTheRight } from "./colision.v1";


describe("Colision", () => {
  test('Si je bouge "1" sur "3", je dois avoir "0" sur l\'élément déplacé et 3,4,5 sont décallé vers la droite', () => {
    const givenEntries = ["1", "2", "3", "4", "5"];
    const expectedEntries = ["0", "2", "1", "3", "4", "5"];
    const actualEntries = updatePositionToTheRight(givenEntries, "3", "1");
    expect(actualEntries).toEqual(expectedEntries);
  });

  test('Si je décalle "1" sur "2", je dois avoir "0" sur lélément déplacé et 2,3,4,5 sont décallé vers la droite', () => {
    const givenEntries = ["1", "2", "3", "4", "5"];
    const expectedEntries = ["0", "1", "2", "3", "4", "5"];
    const actualEntries = updatePositionToTheRight(givenEntries, "2", "1");
    expect(actualEntries).toEqual(expectedEntries);
  });

  test("Si 1 s'aggrandi et prend 3 place, je dois décaller les autres entries", () => {
    const givenEntries = ["1", "2", "3", "4", "5"];
    const expectedEntries = ["1", "1", "1", "2", "3", "4", "5"];
    const actualEntries = expandEntryToTheRight(givenEntries, "1", 2);
    expect(actualEntries).toEqual(expectedEntries);
  })

  test('Si 2 s\'aggrandi et prend 3 place, et que je le déplace sur "4" je dois décaller les autres entries', () => {
    const givenEntries = ["1", "2", "3", "4", "5"];
    const expectedEntries = ["1", "0","3","2", "2", "2", "4", "5"];
    const actualEntries = expandEntryToTheRight(givenEntries, "2", 2);
    const actualEntries2 = updatePositionToTheRight(actualEntries, "4", "2");
    expect(actualEntries2).toEqual(expectedEntries);
  })
});
