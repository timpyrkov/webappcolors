Let us refactor the palette-bulding pipeline.

1) In palettes.js rename "accents" to "seed". In layout rename "Acc1" -> "Seed1", "Acc2" -> "Seed2", etc.

2) In palettes.js replace "special" with a bool flag "extend". Set "extend" to true for Ruby, Amethyst, and Opal. For others - to false.

3) Update gen_colours.js module to include functionality for:

a) Lighten/Darken, Saturate/Desaturate, Change Hue color in OKLCH space (please suggest interface - value of change: absolute or relative? pros and cons?)

b) Create defined number of gradiant anchors from input anchors using OKLCH space.

All colours should be input and output in hex rgb, while colour transformations (Lighten/Darken, Saturate/Desaturate, Change Hue) should be performed in OKLCH space.

4) Update gen_colours.js palette-building functionality to do this:

a) Take inputs:

i) main colour (hex rgb);

ii) list of at least two seed colours (all hex rgb) - check that there are at least two seed colour or exit with error (return default palette with all necessary tokens but simply with default values - mainly monochrome);

iii) flag to extend gradient using main colour;

b) Create these tokens:

i) 12 neutral tokens sharing same or close hue to the main colour

ii) 5 primary accent tokens (seed1 -> primary-accent-1, [interpolate], seed2 -> primary-accent-5)

iii) 5 secondary accent tokens: 

- if only two seed colors given, use neutrals: (neutral-7 -> secondary-accent-1, [interpolate], neutral-9 -> secondary-accent-5) for dark theme and (neutral-4 -> secondary-accent-1, [interpolate], neutral-6 -> secondary-accent-5) for light theme;

- else if only three seed colors given, use seed3-neutrals: generate 12 seed3-neutrals in the same way as the main 12 neutral tokens, then: (seed3-neutral-7 -> secondary-accent-1, [interpolate], seed3-neutral-9 -> secondary-accent-5) for dark theme and (seed3-neutral-4 -> secondary-accent-1, [interpolate], seed3-neutral-6 -> secondary-accent-5) for light theme;

- else if more than three seed colours given: (seed3 -> secondary-accent-1, [interpolate], seed4 -> secondary-accent-5) for both themes;

iv) 





c)













Refine the generation of 








I. Colour palettes.
===================

1) Config file palette_config.json should contain initial data for dynamic palette colours generation for each palette:

a) Palette name;

b) Seed colours: Main, Seed1, Seed2. Optionally may also contain more seed colours: Seed3, Seed4, Seed5, Seed6, Seed7.

c) Flag to include Main colour in gradient.

2) Module pallete_gen.js with functionality to convert, transform colours, creating and sampling gradients (colormaps), creating a list of tokens fr a palette. My idea for basic rules is this:

a) 

a) Generate 12 neutral tokens (--neutral-1 to --neutral-12) from Main colour, sharing same or similar hue from the darkest --neutral-1 to the lightest --neutral-12. Note: 

b) 

b) Generate 5 primary accent tokens (--primary-1 to --primary-3) from 







II. UI Layout.
==============

Let us first create a basic project layout: Left panel for Controls, approximately 1/3 of window width. Rignt panel for canvas, examples, etc.

Left panel (static):
--------------------

a) Project title: "Gruvbox & Monokai".

b) Verrsion: Let us create a git tag "v1.0.0" with message "Gruvbox" and let the script parse it from git and show in this field in the UI.

c) Language selection segmented control (3x3): EN, ES, IT, FR, DE, RU, KO, JA, ZH.

d) Navigation buttons between pages showing in the right panel: 

"Home": main page showcasing basic web UI elements colored in currently selected palette/theme combination;

"Gradient": experimentation tools to work with colors;

"Image": an interface to upload a jpg/png/webp/avif/heic image and recolor it into cureently selected palette/theme combination, and optionally download.

Later we will add more controls.

Right panel "Home" mode:
------------------------

Two columns:

Left column:






Right column:




Right panel "Gradient" mode:
----------------------------



Right panel "Home" mode:
------------------------





Make the project compatible with both running locally and deployment on Vercel.