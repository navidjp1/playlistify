import { library, config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css"; // Import the CSS
import {
    faBroom,
    faSort,
    faArrowsSplitUpAndLeft,
} from "@fortawesome/free-solid-svg-icons";

// Prevent Font Awesome from dynamically adding its CSS since we imported it above
config.autoAddCss = false;

// Add icons to the library so you can use them throughout your app
library.add(faBroom, faSort, faArrowsSplitUpAndLeft);
