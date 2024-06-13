#import "Basic";
#import "String";
#import "File";
#import "File_Utilities";
#import "Sort";

CARDS\ _DIRECTORY :: "assets/cards";
SCRIPTS_DIRECTORY :: "assets/js";
STYLES\_DIRECTORY :: "assets/css";
IMAGES\_DIRECTORY :: "assets/img";
OUTPUT\_DIRECTORY :: "./";

CARDS_PER_PAGE    :: 30;
CARDS_PATHS       :: #run quick_sort(file_list(CARDS_DIRECTORY), (a, b) => compare_strings(b, a));
PAGES_COUNT       :: #run (CARDS_PATHS.count / CARDS_PER_PAGE) + 1;

main :: () {
    HEAD :: #string HTML
    <head>
        <title>hfr4 website</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" type="image/x-icon" href="./assets/img/favicon.ico">
        <link rel="stylesheet" href="./assets/css/elk.min.css"/>
        <link rel="stylesheet" href="./assets/css/style.css"/>
    </head>
    HTML

    BODY_BEFORE_CONTENT :: #string HTML
    <body>
        <div class="row mhs mvs">
            <div class="col-3"></div>
            <div class="col-6">
    HTML

    BODY_AFTER_CONTENT :: #string HTML
            </div>
            <div class="col-3"></div>
        </div>
    </body>
    HTML

    NAV :: #string HTML
    <nav>
        <a href="./index.html">index</a>
    </nav>
    HTML

    IMAGE_MODAL :: #string HTML
    <div class="hcenter vcenter" id="gallery_img_modal" onclick="close_gallery_img()">
        <div class="hcenter vcenter shs svs" id="gallery_img_div">
            <img id="gallery_img_img">
        </div>
    </div>
    HTML

    VIDEO_MODAL :: #string HTML
    <div class="hcenter vcenter" id="gallery_vid_modal" onclick="close_gallery_vid()">
        <div class="hcenter vcenter shs svs" id="gallery_vid_div" >
            <video id="gallery_vid_video" poster="" preload="metadata" controls>
                <source id="gallery_vid_source" src="" type="video/mp4">
            </video>
        </div>
    </div>
    HTML

    GALLERY_SCRIPT :: #string HTML
    <script type="text/javascript" src="./assets/js/gallery.js"></script>
    HTML

    for 1..PAGES_COUNT {
        builder: String_Builder;
        print_to_builder(*builder, "<!DOCTYPE html>\n");
        print_to_builder(*builder, "<html>\n");
        print_to_builder(*builder, HEAD);
        print_to_builder(*builder, BODY_BEFORE_CONTENT);
        print_to_builder(*builder, NAV);
        print_to_builder(*builder, generate_breadcrumb(it));
        print_to_builder(*builder, "<hr/>\n");
        print_to_builder(*builder, generate_cards(it));
        print_to_builder(*builder, "<hr/>\n");
        print_to_builder(*builder, generate_breadcrumb(it));
        print_to_builder(*builder, IMAGE_MODAL);
        print_to_builder(*builder, VIDEO_MODAL);
        print_to_builder(*builder, GALLERY_SCRIPT);
        print_to_builder(*builder, BODY_AFTER_CONTENT);
        print_to_builder(*builder, "</html>\n");

        if it == 1 write_entire_file(tprint("%/index.html", OUTPUT_DIRECTORY)    , *builder);
        else       write_entire_file(tprint("%/%.html"    , OUTPUT_DIRECTORY, it), *builder);
    }
}

generate_dropdown :: (page_index: int) -> string {
    builder: String_Builder;

    print_to_builder(*builder, "<select class=\"dropdown_select\" onChange=\"window.location.href=this.value\" name=\"page_selection\">\n");

    OPTION :: #string HTML
    <option value="%" % > % </option>
    HTML

    for i: 1..PAGES_COUNT {
        value    := ifx i == 1 then "./index.html" else tprint("./%.html", i);
        selected := ifx page_index == i then "selected" else "";
        print_to_builder(*builder, OPTION, value, selected, i);
    }

    print_to_builder(*builder, "</select>\n");

    return builder_to_string(*builder);
}

generate_breadcrumb :: (page_index: int) -> string {
    builder: String_Builder;

    print_to_builder(*builder, "<div class=\"hcenter\">\n");

    ACTIVE_ARROW :: #string HTML
    <a class ="shs active_arrow" href="./%.html">%</a>
    HTML

    INACTIVE_ARROW :: #string HTML
    <a class ="shs inactive_arrow">%</a>
    HTML

    if page_index == PAGES_COUNT {
        print_to_builder(*builder, ACTIVE_ARROW, page_index - 1, "<");
        print_to_builder(*builder, generate_dropdown(page_index));
        print_to_builder(*builder, INACTIVE_ARROW, ">");
    } else if page_index == 1 {
        print_to_builder(*builder, INACTIVE_ARROW, "<");
        print_to_builder(*builder, generate_dropdown(page_index));
        print_to_builder(*builder, ACTIVE_ARROW, page_index + 1, ">");
    } else if page_index == 2 {
        print_to_builder(*builder, ACTIVE_ARROW, "index", "<");
        print_to_builder(*builder, generate_dropdown(page_index));
        print_to_builder(*builder, ACTIVE_ARROW, page_index + 1, ">");
    } else {
        print_to_builder(*builder, ACTIVE_ARROW, page_index - 1, "<");
        print_to_builder(*builder, generate_dropdown(page_index));
        print_to_builder(*builder, ACTIVE_ARROW, page_index + 1, ">");
    }

    print_to_builder(*builder, "</div>\n");

    return builder_to_string(*builder);
}

generate_cards :: (page_index: int) -> string {
    builder: String_Builder;

    print_to_builder(*builder, "<div class=\"hcenter cards_container\">\n");

    first_path_index := (page_index - 1) * CARDS_PER_PAGE;
    last_path_index  := first_path_index + CARDS_PER_PAGE - 1;

    for first_path_index..last_path_index {
        if it >= CARDS_PATHS.count break;

        path      := CARDS_PATHS[it];
        extension := path_extension(path);

        if extension == {
            case "png"; print_to_builder(*builder, generate_card_for_image(path));
            case "jpg"; print_to_builder(*builder, generate_card_for_image(path));
            case "gif"; print_to_builder(*builder, generate_card_for_image(path));
            case "mp4"; print_to_builder(*builder, generate_card_for_video(path));
            case;       assert(false, "Can't generate card for %", path);
        }
    }

    print_to_builder(*builder, "</div>\n");

    return builder_to_string(*builder);
}

generate_card_for_image :: (path: string) -> string {
    builder: String_Builder;

    IMAGE_CARD :: #string HTML
    <div class="card svs shs">
        <div class="card_header"> 
            <div class="card_title">%1</div>
        </div>
        <div class="card_body" onclick="open_gallery_img('./%2')">
            <img class="card_img" src="./%2"/>
        </div>
    </div>
    HTML

    stripped_filename := path_strip_extension(path_filename(path));
    print_to_builder(*builder, IMAGE_CARD, stripped_filename, path);

    return builder_to_string(*builder);
}

generate_card_for_video :: (path: string) -> string {
    builder: String_Builder;

    VIDEO_CARD :: #string HTML
    <div class="card svs shs">
        <div class="card_header">
            <div class="card_title">%1</div>
        </div>
        <div class="card_body" style="position: relative;" onclick="open_gallery_vid('./%2')">
            <svg class="card_video_svg">
                <circle cx="50" cy="50" fill="#000" fill-opacity=".7" r="24"></circle>
                <polygon points="46,43 46,57 60,50" fill="#eee" stroke="#eee" stroke-width="3" stroke-linejoin="round"></polygon>
            </svg>
            <video class="card_video" poster=%2 preload=metadata>
                <source src="./%2" type="video/mp4">
            </video>
        </div>
    </div>
    HTML

    stripped_filename := path_strip_extension(path_filename(path));
    print_to_builder(*builder, VIDEO_CARD, stripped_filename, path);

    return builder_to_string(*builder);
}
