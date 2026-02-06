-- Create question_packs table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS question_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  difficulty difficulty NOT NULL DEFAULT 'medium',
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE question_packs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read question packs
CREATE POLICY "Question packs are viewable by everyone" 
  ON question_packs FOR SELECT 
  USING (true);

-- Sample question pack: General Knowledge
INSERT INTO question_packs (name, description, difficulty, questions) VALUES
(
  'General Knowledge',
  'A mix of trivia questions for all ages',
  'medium',
  '[
    {
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctIndex": 2
    },
    {
      "text": "Which planet is known as the Red Planet?",
      "options": ["Venus", "Mars", "Jupiter", "Saturn"],
      "correctIndex": 1
    },
    {
      "text": "What is the largest mammal in the world?",
      "options": ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
      "correctIndex": 1
    },
    {
      "text": "In what year did World War II end?",
      "options": ["1943", "1944", "1945", "1946"],
      "correctIndex": 2
    },
    {
      "text": "What is the chemical symbol for gold?",
      "options": ["Go", "Gd", "Au", "Ag"],
      "correctIndex": 2
    },
    {
      "text": "Which artist painted the Mona Lisa?",
      "options": ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      "correctIndex": 2
    },
    {
      "text": "What is the largest ocean on Earth?",
      "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      "correctIndex": 3
    },
    {
      "text": "How many continents are there on Earth?",
      "options": ["5", "6", "7", "8"],
      "correctIndex": 2
    },
    {
      "text": "What is the hardest natural substance on Earth?",
      "options": ["Gold", "Iron", "Diamond", "Platinum"],
      "correctIndex": 2
    },
    {
      "text": "Which country hosted the 2016 Summer Olympics?",
      "options": ["China", "UK", "Brazil", "Japan"],
      "correctIndex": 2
    }
  ]'::jsonb
);

-- Sample question pack: 90s Pop Culture
INSERT INTO question_packs (name, description, difficulty, questions) VALUES
(
  '90s Pop Culture',
  'Test your knowledge of the greatest decade!',
  'medium',
  '[
    {
      "text": "Which TV show featured characters named Ross, Rachel, Monica, Chandler, Joey, and Phoebe?",
      "options": ["Seinfeld", "Friends", "Frasier", "The Office"],
      "correctIndex": 1
    },
    {
      "text": "What was the best-selling video game console of the 1990s?",
      "options": ["Sega Genesis", "Nintendo 64", "Sony PlayStation", "Super Nintendo"],
      "correctIndex": 2
    },
    {
      "text": "Which boy band released the album ''Millennium'' in 1999?",
      "options": ["NSYNC", "Backstreet Boys", "98 Degrees", "New Kids on the Block"],
      "correctIndex": 1
    },
    {
      "text": "What movie features the quote ''Life is like a box of chocolates''?",
      "options": ["The Shawshank Redemption", "Pulp Fiction", "Forrest Gump", "Titanic"],
      "correctIndex": 2
    },
    {
      "text": "Which web browser was the most popular in the mid-1990s?",
      "options": ["Internet Explorer", "Netscape Navigator", "Mozilla Firefox", "Google Chrome"],
      "correctIndex": 1
    },
    {
      "text": "What toy was a must-have craze in 1996-1997?",
      "options": ["Furby", "Tamagotchi", "Tickle Me Elmo", "Beanie Babies"],
      "correctIndex": 2
    },
    {
      "text": "Which artist released the hit song ''...Baby One More Time'' in 1998?",
      "options": ["Christina Aguilera", "Britney Spears", "Jessica Simpson", "Mandy Moore"],
      "correctIndex": 1
    },
    {
      "text": "What was the name of the cloned sheep announced in 1997?",
      "options": ["Dolly", "Molly", "Polly", "Holly"],
      "correctIndex": 0
    },
    {
      "text": "Which 1997 movie became the highest-grossing film of all time?",
      "options": ["Jurassic Park", "The Lion King", "Titanic", "Independence Day"],
      "correctIndex": 2
    },
    {
      "text": "What handheld gaming device did Nintendo release in 1989 that dominated the 90s?",
      "options": ["Game Gear", "Game Boy", "Neo Geo Pocket", "Atari Lynx"],
      "correctIndex": 1
    }
  ]'::jsonb
);

-- Sample question pack: Science & Nature (Easy)
INSERT INTO question_packs (name, description, difficulty, questions) VALUES
(
  'Science & Nature',
  'Easy science questions for curious minds',
  'easy',
  '[
    {
      "text": "What gas do plants absorb from the atmosphere?",
      "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      "correctIndex": 2
    },
    {
      "text": "How many legs does a spider have?",
      "options": ["6", "8", "10", "12"],
      "correctIndex": 1
    },
    {
      "text": "What is the closest star to Earth?",
      "options": ["Alpha Centauri", "The Sun", "Sirius", "Betelgeuse"],
      "correctIndex": 1
    },
    {
      "text": "What is H2O commonly known as?",
      "options": ["Salt", "Sugar", "Water", "Oxygen"],
      "correctIndex": 2
    },
    {
      "text": "Which organ pumps blood through the body?",
      "options": ["Brain", "Liver", "Lungs", "Heart"],
      "correctIndex": 3
    },
    {
      "text": "What do caterpillars turn into?",
      "options": ["Beetles", "Butterflies", "Bees", "Dragonflies"],
      "correctIndex": 1
    },
    {
      "text": "How many colors are in a rainbow?",
      "options": ["5", "6", "7", "8"],
      "correctIndex": 2
    },
    {
      "text": "What is the largest planet in our solar system?",
      "options": ["Saturn", "Jupiter", "Neptune", "Uranus"],
      "correctIndex": 1
    }
  ]'::jsonb
);
