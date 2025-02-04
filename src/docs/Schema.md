## Représentation des workflows

- 1,2,3,... : réprésente une tuile, si 1,1 cela signifie que la tuile prend 2 cellule
- x: réprésente une cellule vide
- h: réprésente la cell ou la sourie se trouve
- |: réprésente une séparation entre les cellules
- les cellules seront toujours déplacé soit vers la droite, soit vers le bas

### Grid de départ

```
|x|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```

### Resize d'une tuile avec tuile adjacente

- exemple simple avec la place:

Départ:
```
|1|2|x|3|x|
|3|5|7|8|x|
|4|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```
Arrivée:
```
|1|1|2|3|x|
|1|1|5|7|8|
|4|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```

- exemple complexe avec déplacement de tuile en cascade:

Départ:
```
|1|2|3|4|x|
|5|7|8|x|x|
|9|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```

Arrivée:
```
|1|1|2|3|4|
|1|1|7|8|x|
|5|x|x|x|x|
|9|x|x|x|x|
|x|x|x|x|x|
```

### Déplacement d'une tuile

- exemple simple, je déplace 1 vers 3, même taille:

Départ:
```
|1|2|3|4|x|
|5|7|8|x|x|
|9|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```

Arrivée:
```
|x|2|1|3|4|
|5|7|8|x|x|
|9|x|x|x|x|
|x|x|x|x|x|
|x|x|x|x|x|
```

- exemple complexe, je déplace 1 vers 3, taille différente:

Départ:
```
|1|1|2|3|4|x|
|1|1|7|8|x|x|
|5|x|x|x|x|x|
|9|x|x|x|x|x|
|x|x|x|x|x|x|
```

Arrivée:
```
|2|x|1|1|3|4|
|x|x|1|1|x|x|
|5|x|7|8|x|x|
|9|x|x|x|x|x|