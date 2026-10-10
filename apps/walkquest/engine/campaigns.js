/**
 * V1 campaigns. Distances are rounded for the game.
 * Maps are stylized drawings, not surveys. Place names describe a route.
 */

import { WALKER_CHAPTERS } from './chapters.js';

const FIELD = {
  chicago: 'Route 66 was established in 1926 and set out from Chicago toward the Pacific. The city on Lake Michigan is the start of this long haul. City miles count the same as desert miles.',
  pontiac: 'Pontiac, Illinois, is a small town with a classic downtown and a museum about the old highway. Travelers have been stopping here since the road\'s early years. The main street still wears that history.',
  springfieldIl: 'Springfield is the capital of Illinois and home to Abraham Lincoln\'s house and tomb. The old highway passes through on its way toward the Mississippi River. It is a capital city you can cross one block at a time.',
  stLouis: 'Saint Louis sits on the Mississippi River, the crossing from Illinois into Missouri. The Gateway Arch frames the river and the western sky. This is where the drive leaves the first state behind.',
  rolla: 'Rolla, Missouri, is a college town in the Ozark foothills. The old road rolls through hills here instead of prairie. The route was never only a straight line.',
  springfieldMo: 'Springfield, Missouri, grew up as a crossroads on the way into the Ozarks. Travelers used it as a stop between the river cities and Oklahoma. The town still keeps the old road close to its front porch.',
  joplin: 'Joplin, Missouri, sits near the Kansas and Oklahoma lines and grew as a lead and zinc mining town. The highway runs through before it drops into Oklahoma. The hills east of town are the last of the Ozarks on this route.',
  tulsa: 'Tulsa, Oklahoma, built a downtown of art deco towers during the oil boom. The highway crosses the Arkansas River here. It is a city stop on a road better known for small towns.',
  okc: 'Oklahoma City is the state capital, spread across the plains. Route 66 once ran on city streets here, before the interstates pulled traffic away. The land around it is wide and windy.',
  elk: 'Elk City, Oklahoma, is a western Oklahoma stop with a museum about the old highway. Ranch country takes over the view. The towns get farther apart from here west.',
  amarillo: 'Amarillo sits in the Texas Panhandle, a cattle and railroad town on the high plains. The sky does most of the talking. The road crosses the city on the way toward New Mexico.',
  tucumcari: 'Tucumcari, New Mexico, is known for a long main street of vintage motor-court signs. The high desert starts to show its colors here. A well-known song about the highway names this town.',
  santaRosa: 'Santa Rosa, New Mexico, is a small town with natural lakes in dry country, including the Blue Hole, a clear spring-fed pool. Travelers have used the stop for decades. The plains around it run on toward the mountains.',
  albuquerque: 'Albuquerque spreads along the Rio Grande, with the Sandia Mountains on the east. Old Route 66 followed Central Avenue through the city. It is the biggest city on the New Mexico stretch.',
  gallup: 'Gallup, New Mexico, is a railroad and trading town near the Arizona line, long tied to Navajo, Zuni, and other Native trade. The highway runs west from here into Arizona. Red rock starts to take the horizon.',
  holbrook: 'Holbrook, Arizona, is a high-desert railroad town near Petrified Forest National Park. Historic Route 66 is the town\'s old main street. Painted desert country is the neighbor to the east.',
  winslow: 'Winslow, Arizona, is a railroad town on the Colorado Plateau. A popular song carried the town\'s name far past the high desert. The old storefronts still face the tracks.',
  flagstaff: 'Flagstaff sits around 7,000 feet among ponderosa pines, with the San Francisco Peaks nearby. Route 66 runs through downtown as a historic main street. It is a high, green pause between desert stretches.',
  seligman: 'Seligman, Arizona, is a tiny town that kept historic Route 66 in the public story after the interstate bypassed it. Shops and old signs line the main road. The town is small, and the welcome is the point.',
  kingman: 'Kingman, Arizona, sits in the Mojave Desert between the mountains and the Colorado River. The road passes through on the way toward California. The stretch ahead is hot, open country, best walked in cooler hours with water.',
  needles: 'Needles, California, is a desert town on the Colorado River, named for a group of sharp peaks nearby. It is one of the hottest, driest stops on the drive. Bring water and use the cooler hours in country like this.',
  barstow: 'Barstow, California, is a desert crossroads in the Mojave, where railroads and highways meet. Travelers knew it as a last long stop before the Los Angeles basin. The mountains to the west are the way out of the desert.',
  sanBernardino: 'San Bernardino lies where the old highway leaves the desert and meets the inland valleys. The San Bernardino Mountains stand above town. City streets take over from the open road here.',
  santaMonica: 'The Santa Monica Pier, on the Pacific, is the traditional western end of this trip. The road has run from Lake Michigan to the ocean. However you paced it, this is the far end of the game map.',
};

function note(id, title, miles, place, mapLabel, body) {
  return {
    id, title, miles, place, mapLabel, body, kind: 'note', takeaway: '',
  };
}

function snake(stops) {
  const last = stops.length - 1;
  return stops.map((stop, index) => {
    const t = last === 0 ? 0 : index / last;
    const y = Math.round(48 + t * 468);
    const x = Math.round(200 + Math.sin(t * Math.PI * 4) * 126);
    return { ...stop, x, y };
  });
}

const routeStops = snake([
  note('chicago', 'Chicago', 0, 'Illinois', 'Chicago', FIELD.chicago),
  note('pontiac', 'Pontiac', 90, 'Illinois', 'Pontiac', FIELD.pontiac),
  note('springfield-il', 'Springfield', 200, 'Illinois', 'Springfield', FIELD.springfieldIl),
  note('st-louis', 'St. Louis', 310, 'Missouri', 'St. Louis', FIELD.stLouis),
  note('rolla', 'Rolla', 420, 'Missouri', 'Rolla', FIELD.rolla),
  note('springfield-mo', 'Springfield', 530, 'Missouri', 'Springfield', FIELD.springfieldMo),
  note('joplin', 'Joplin', 640, 'Missouri', 'Joplin', FIELD.joplin),
  note('tulsa', 'Tulsa', 750, 'Oklahoma', 'Tulsa', FIELD.tulsa),
  note('oklahoma-city', 'Oklahoma City', 880, 'Oklahoma', 'OKC', FIELD.okc),
  note('elk-city', 'Elk City', 1000, 'Oklahoma', 'Elk City', FIELD.elk),
  note('amarillo', 'Amarillo', 1140, 'Texas', 'Amarillo', FIELD.amarillo),
  note('tucumcari', 'Tucumcari', 1270, 'New Mexico', 'Tucumcari', FIELD.tucumcari),
  note('santa-rosa', 'Santa Rosa', 1380, 'New Mexico', 'Santa Rosa', FIELD.santaRosa),
  note('albuquerque', 'Albuquerque', 1500, 'New Mexico', 'Albuquerque', FIELD.albuquerque),
  note('gallup', 'Gallup', 1630, 'New Mexico', 'Gallup', FIELD.gallup),
  note('holbrook', 'Holbrook', 1750, 'Arizona', 'Holbrook', FIELD.holbrook),
  note('winslow', 'Winslow', 1830, 'Arizona', 'Winslow', FIELD.winslow),
  note('flagstaff', 'Flagstaff', 1910, 'Arizona', 'Flagstaff', FIELD.flagstaff),
  note('seligman', 'Seligman', 2010, 'Arizona', 'Seligman', FIELD.seligman),
  note('kingman', 'Kingman', 2110, 'Arizona', 'Kingman', FIELD.kingman),
  note('needles', 'Needles', 2190, 'California', 'Needles', FIELD.needles),
  note('barstow', 'Barstow', 2270, 'California', 'Barstow', FIELD.barstow),
  note('san-bernardino', 'San Bernardino', 2340, 'California', 'San Bernardino', FIELD.sanBernardino),
  note('santa-monica', 'Santa Monica Pier', 2400, 'California', 'Santa Monica', FIELD.santaMonica),
]);

export const CAMPAIGNS = [
  {
    id: 'rim',
    name: 'Canyon Rim to Rim',
    tag: 'Starter',
    distance: 24,
    theme: 'canyon',
    summary: 'A starter crossing from the North Rim to the South Rim. About 24 miles, rounded for the game.',
    stops: [
      note('north-rim', 'North Rim trailhead', 0, 'North Rim', 'North Rim', 'The North Rim of the Grand Canyon sits higher than the South Rim, with more pine and a shorter season. The trail drops from cool forest toward the inner canyon. This game map is a rounded 24-mile crossing, not a navigation guide.'),
      note('cottonwood', 'Cottonwood camp', 7, 'Bright Angel Creek', 'Cottonwood', 'Cottonwood Campground sits beside Bright Angel Creek, partway down from the North Rim. It is a shaded camp in a canyon that is mostly stone and sun. In the game it marks the first long step below the rim.'),
      note('phantom', 'Phantom Ranch area', 14, 'Colorado River', 'Phantom Ranch', 'The Phantom Ranch area sits near the Colorado River at the bottom of the canyon. People reach that country by trail, and the river marks the middle of a rim-to-rim crossing. This checkpoint is the game\'s version of that stretch.'),
      note('gardens', 'Havasupai Gardens area', 19, 'Bright Angel Trail', 'Gardens', 'Havasupai Gardens is a cottonwood grove and creek stop on the Bright Angel Trail, below the South Rim. The name honors the Havasupai people, whose homelands include the canyon. It is greener than the rock around it.'),
      note('south-rim', 'South Rim', 24, 'South Rim', 'South Rim', 'The South Rim is the Grand Canyon\'s most visited rim, with wide views back across the canyon. Finishing here completes this rounded 24-mile game route. A real rim-to-rim hike needs its own plan, water, and a current trail report.'),
    ].map((stop, index) => {
      const spots = [[70, 78], [128, 210], [200, 360], [278, 210], [332, 78]];
      return { ...stop, x: spots[index][0], y: spots[index][1] };
    }),
  },
  {
    id: 'walker',
    name: 'The Walker',
    tag: 'Story',
    distance: 100,
    theme: 'desert',
    summary: 'A 100-mile story across a fictional Sonoran Desert, from Cholla Springs to Ironwood Peak.',
    stops: WALKER_CHAPTERS.map((chapter, index) => {
      const spots = [
        [78, 508], [292, 452], [328, 372], [236, 318], [112, 286],
        [86, 214], [196, 176], [312, 128], [214, 78], [250, 36],
      ];
      return {
        ...chapter,
        kind: 'chapter',
        x: spots[index][0],
        y: spots[index][1],
      };
    }),
  },
  {
    id: 'route66',
    name: 'Route 66 Road Trip',
    tag: 'Long haul',
    distance: 2400,
    theme: 'road',
    summary: 'The long haul from Chicago to the Santa Monica pier. About 2,400 miles, one checkpoint at a time.',
    stops: routeStops,
  },
];

export function getCampaign(id) {
  return CAMPAIGNS.find((campaign) => campaign.id === id) || null;
}

export function getStop(campaignId, stopId) {
  const campaign = getCampaign(campaignId);
  return campaign?.stops.find((stop) => stop.id === stopId) || null;
}
