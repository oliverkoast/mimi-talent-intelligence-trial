import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))

from roster_sync import height_to_inches, parse_colon_attributes, normalize_slug

class RosterSyncHelpersTest(unittest.TestCase):
    def test_height_to_inches(self):
        self.assertEqual(height_to_inches("5'10\""), 70)
        self.assertIsNone(height_to_inches('Not listed'))

    def test_parse_colon_attributes(self):
        values = parse_colon_attributes(['Hair Color: Brown', 'Suit Size: 40R', 'No delimiter'])
        self.assertEqual(values, {'Hair Color': 'Brown', 'Suit Size': '40R'})

    def test_normalize_slug(self):
        self.assertEqual(normalize_slug('José O’Neil'), 'jose-o-neil')

if __name__ == '__main__':
    unittest.main()
