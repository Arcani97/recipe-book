export function getPlayerCharacterGroups(actorIds = null) {
  const alreadyListed = new Set();
  const groups = [];

  for (const user of game.users) {
    if (user.isGM) continue;

    let actors = game.actors.filter(a => a.testUserPermission(user, "OWNER"));
    if (actorIds) actors = actors.filter(a => actorIds.includes(a.id));
    actors = actors.filter(a => !alreadyListed.has(a.id));
    for (const a of actors) alreadyListed.add(a.id);

    if (actors.length) {
      groups.push({
        userId: user.id,
        userName: user.name,
        actors: actors.map(a => ({ id: a.id, name: a.name, img: a.img }))
      });
    }
  }

  return groups;
}
