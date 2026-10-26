<?php

namespace Database\Seeders;

use App\Models\ZetwareResolution;
use Illuminate\Database\Seeder;

class ZetwareResolutionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $resolutions = [
            '_1920x1038' => 'FALL 2 DEADPOINT FHD',
            '_1280x692' => 'FALL 2 DEADPOINT HD',
            '_640x346' => 'FALL 2 DEADPOINT SD',
            '_1920x904' => 'STREET FIGHTER FHD',
            '_1280x602' => 'STREET FIGHTER HD',
            '_640x302' => 'STREET FIGHTER SD',
            '_1620x1080' => 'OBSESSION FHD',
            '_1080x720' => 'OBSESSION HD',
            '_540x360' => 'OBSESSION SD',
            '_1920x800' => '2.39:1 ultrawide cinema (HOPE, INSIDIOUS, SPIDER-MAN)',
            '_1920x802' => '2.39:1 scope (ANIMALS)',
            '_1920x804' => '2.39:1 scope (MATCHBOX THE MOVIE)',
            '_1920x806' => '2.39:1 scope',
            '_1920x808' => '2.39:1 scope',
            '_1920x810' => '2.39:1 scope',
            '_1920x812' => '2.35:1 scope',
            '_1920x816' => '2.35:1 scope',
            '_1920x820' => '2.35:1 scope',
            '_1920x1000' => '1.92:1 cinema (THE ODYSSEY)',
            '_1920x960' => '2:1 cinema FHD (LANTERNS)',
            '_1920x1080' => '1080p 16:9',
            '_1280x532' => '720p scope',
            '_1280x534' => '2.39:1 scope 720p (ANIMALS, HOPE, INSIDIOUS)',
            '_1280x536' => '2.39:1 scope (MATCHBOX THE MOVIE)',
            '_1280x538' => '720p scope',
            '_1280x540' => '720p scope',
            '_1280x542' => '720p scope',
            '_1280x544' => '2.35:1 scope',
            '_1280x666' => '1.92:1 cinema (THE ODYSSEY)',
            '_1280x640' => '2:1 cinema HD (LANTERNS)',
            '_1280x720' => '720p 16:9',
            '_640x264' => 'mobile scope',
            '_640x266' => '2.39:1 scope mobile (SPIDER-MAN, INSIDIOUS)',
            '_640x268' => '2.39:1 scope mobile (MATCHBOX THE MOVIE, ANIMALS)',
            '_640x270' => 'mobile scope',
            '_640x272' => '2.35:1 scope mobile',
            '_640x334' => '1.92:1 cinema mobile (THE ODYSSEY)',
            '_640x320' => '2:1 cinema mobile SD (LANTERNS)',
            '_640x360' => '360p 16:9',
            '_854x480' => '480p 16:9',
            '_854x356' => '2.39:1 480p',
            '_854x358' => '480p scope',
            '_854x360' => '480p scope',
            '_960x480' => '2:1 480p',
            '_3840x2160' => '4K 16:9',
            '_3840x1600' => '4K 2.40:1 scope',
            '_3840x1604' => '4K 2.39:1 scope',
            '_1920' => '1080p single dimension',
            '_1280' => '720p single dimension',
            '_960' => '480p single dimension',
            '_854' => '480p single dimension',
            '_640' => '360p single dimension',
            '_3840' => '4K single dimension',
            '_1080p' => '1080p label',
            '_720p' => '720p label',
            '_480p' => '480p label',
            '_360p' => '360p label',
            '_2160p' => '4K label',
            '_4K' => '4K label',
            '_4k' => '4K label',
        ];

        foreach ($resolutions as $res => $notes) {
            ZetwareResolution::registerResolution($res, $notes);
        }
    }
}
