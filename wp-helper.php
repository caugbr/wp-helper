<?php
/**
 * Plugin name: WP Helper
 * Description: Some helper functions for WP
 * Version: 1.0
 * Author: Cau Guanabara
 * Author URI: mailto:cauguanabara@gmail.com
 * License: Wordpress
 */

if (!defined('ABSPATH')) {
    exit;
}

class WpHelper {
    public $textdomains = [];
    public $no_gutenberg_types = [];
    public $unique_terms = [];
    public $scripts = [];
    public $priority_scripts = [];
    public $styles = [];
    public $tabs = [];
    public $roles = [];
    private $functionalities;

    private $path = 'wp-helper/wp-helper.php';

    private $url;

    public function __construct() {
        $this->url = str_replace("\\", "/", plugin_dir_url(__FILE__));

        $this->add_textdomain('wphelper', dirname(plugin_basename(__FILE__)) . '/langs/');

        add_action('init', [$this, 'load_textdomains']);
        add_action('admin_enqueue_scripts', [$this, 'prioritize_scripts'], 9999);
        add_action('wp_enqueue_scripts', [$this, 'prioritize_scripts'], 9999);
        add_action('admin_enqueue_scripts', [$this, 'load_js']);
        add_action('wp_enqueue_scripts', [$this, 'load_js']);
        add_action('wp_enqueue_scripts', [$this, 'load_styles']);
        add_action('wp_enqueue_scripts', [$this, 'load_scripts']);
        add_action('use_block_editor_for_post_type', [$this, 'disable_gutenberg_types'], 10, 2);
        add_action('registered_post_type', [$this, 'me_first']);
        add_action('admin_footer', [$this, 'init_js']);
        $this->functionalities = [
            "actions" => [ "js" => $this->url . 'assets/js/actions.js' ],
            "cookies" => [ "js" => $this->url . 'assets/js/cookies.js' ],
            "locations-ibge" => [ "js" => $this->url . 'assets/js/locations-ibge.js' ],
            "popup" => [
                "js" => $this->url . 'assets/js/popup.js',
                "css" => $this->url . 'assets/css/popup.css'
            ],
            "dialog" => [
                "js" => $this->url . 'assets/js/dialog.js',
                "css" => $this->url . 'assets/css/dialog.css'
            ],
            "tabs" => [
                "js" => $this->url . 'assets/js/tabs.js',
                "css" => $this->url . 'assets/css/tabs.css'
            ],
            // "photoswipe" => [
            //     "js" => $this->url . 'assets/photoswipe/photoswipe-lightbox.esm.js',
            //     "css" => $this->url . 'assets/photoswipe/photoswipe.css'
            // ]
        ];
    }

    public function me_first() {
        $plugins = get_option('active_plugins');
        $ind = array_search($this->path, $plugins);
        if ($ind) {
            unset($plugins[$ind]);
            array_unshift($plugins, $this->path);
            update_option('active_plugins', $plugins);
        }
        remove_action('registered_post_type', [$this, 'me_first']);
    }

    public function add_textdomain($domain, $path) {
        $this->textdomains[$domain] = $path;
    }

    public function disable_gutenberg($post_type) {
        if (!in_array($post_type, $this->no_gutenberg_types)) {
            $this->no_gutenberg_types[] = $post_type;
        }
    }
    
    public function set_unique_term($post_type, $taxonomy) {
        $this->unique_terms[] = compact('post_type', 'taxonomy');
    }

    public function add_style($id, $url = NULL, $deps = [], $condition = '__return_true') {
        $this->styles[$id] = [
            "id" => $id,
            "url" => $url,
            "deps" => $deps,
            "condition" => $condition
        ];
    }

    /**
     * Undocumented function
     *
     * @param string    $id         Script ID handler
     * @param string    $url        Script URL
     * @param array     $deps       Script dependencies
     * @param boolean   $module     True if script should be loaded as an ES6 module
     * @param array     $localize   Array with two elements: ['variable_name', [(associative array)]]
     * @param mixed     $condition  Some callable function to define if script should be loaded
     * @return void
     */
    public function add_script($id, $url, $deps = [], $module = false, $localize = null, $condition = '__return_true') {
        $this->scripts[$id] = [
            "id" => $id,
            "url" => $url,
            "deps" => $deps,
            "is_module" => $module,
            "localize" => $localize,
            "condition" => $condition
        ];
    }
    
    public function load_textdomains() {
        foreach ($this->textdomains as $domain => $path) {
            load_plugin_textdomain($domain, false, $path); 
        }
    }

    public function load($func, $cond = '__return_true', $context = 'admin') {
        if (isset($this->functionalities[$func])) {
            if (is_callable($cond) && call_user_func($cond, $func)) {
                $f = $this->functionalities[$func];
                $act = ($context == 'wp' ? 'wp' : 'admin') . '_enqueue_scripts';
                $fnc = function() use($func, $f) {
                    wp_enqueue_script($func, $f['js']);
                    $this->priority_scripts[] = $func;
                    if (isset($f['css'])) {
                        wp_enqueue_style($func, $f['css']);
                    }
                };
                add_action($act, $fnc);
                if ($context == 'both') {
                    add_action('admin_enqueue_scripts', $fnc);
                }
            }
        }
    }

    public function load_js() {
        wp_enqueue_script('wp-helper-util', $this->url . 'assets/js/util.js');
        // wp_enqueue_script('wp-helper-color', $this->url . 'assets/js/color.js');
        // wp_enqueue_script('wp-helper-css', $this->url . 'assets/js/style.js');
        if (is_admin()) {
            wp_enqueue_script('wp-helper-unique-cat', $this->url . 'assets/js/unique-cat.js');
        }
    }

    public function disable_gutenberg_types($current_status, $post_type) {
        if (in_array($post_type, $this->no_gutenberg_types)) {
            return false;
        }
        return $current_status;
    }

    public function add_user_role($name, $id = '', $caps = 'administrator') {
        if (is_string($caps)) {
            $role = get_role($caps);
            if ($role) {
                $caps = $role->capabilities;
            }
        }
        if (is_array($caps)) {
            if (empty($id)) {
                $id = sanitize_title($name);
            }
            $this->roles[] = [
                "name" => $name,
                "id" => $id,
                "caps" => $caps
            ];
        }
    }
    
    public function add_roles() {
        foreach ($this->roles as $role) {
            remove_role($role['id']);
            add_role($role['id'], $role['name'], $role['caps']);
        }
    }

    private function enqueue_condition($obj) {
        if (is_callable($obj['condition'])) {
            $args = [$obj['id'], $obj['url'], $obj['deps']];
            return call_user_func($obj['condition'], $args);
        }
        return true;
    }

    public function load_styles() {
        foreach ($this->styles as $stl) {
            if (!$this->enqueue_condition($stl)) {
                continue;
            }
            wp_enqueue_style($stl['id'], $stl['url'], $stl['deps']);
        }
    }

    public function load_scripts() {
        $this->load_js();
        foreach ($this->scripts as $scr) {
            if (!$this->enqueue_condition($scr)) {
                continue;
            }
            wp_register_script($scr['id'], $scr['url'], $scr['deps']);
            wp_enqueue_script($scr['id']);
            if (!empty($scr['localize']) && is_string($scr['localize'][0]) && is_array($scr['localize'][1])) {
                wp_localize_script($scr['id'], $scr['localize'][0], $scr['localize'][1]);
            }
            if ($scr['is_module']) {
                add_filter('wp_script_attributes', function ($attrs) use($scr) {
                    if (isset( $attrs['id'] ) && $attrs['id'] === $scr['id'] . '-js') {
                        $attrs['type'] = 'module';
                    }
                    return $attrs;
                });
            }
        }
    }

    public function prioritize_scripts() {
        // Array com os IDs dos scripts que você deseja priorizar.
        // $priority_scripts = array('script-id-1', 'script-id-2', 'script-id-3');
    
        global $wp_scripts;
    
        if (isset($wp_scripts->registered)) {
            // Cria um array temporário para armazenar os scripts prioritários.
            $prioritized = array();
            
            // Itera sobre os scripts prioritários e move-os para o início.
            foreach ($this->priority_scripts as $script_id) {
                if (isset($wp_scripts->registered[$script_id])) {
                    $prioritized[$script_id] = $wp_scripts->registered[$script_id];
                    unset($wp_scripts->registered[$script_id]);
                }
            }
    
            // Reatribui os scripts prioritários ao início do array registered.
            $wp_scripts->registered = $prioritized + $wp_scripts->registered;
        }
    }

    public function init_js() {
        $js = [];
        foreach ($this->unique_terms as $ut) {
            $js[] = "uniqueCat('{$ut['taxonomy']}', '{$ut['post_type']}');";
        }
        if (count($js)) {
            ?>
            <script defer>
                window.addEventListener('load', () => {
                    <?php 
                        $spc = "                    ";
                        print join("\n{$spc}", $js); 
                    ?>
                });
            </script>
            <?php
        }
    }

    /**
     * Add a new post type
     *
     * @since     1.0.0
     * @param string $ptype
     * @param boolean $singular
     * @param boolean $plural
     * @param array $arguments
     * @return register_post_type() return
     */
    public function add_post_type($ptype, $singular = false, $plural = false, $arguments = array()) {
        if (false === $singular) {
            $singular = ucfirst($ptype);
        }
        if (false === $plural) {
            $plural = $singular . 's';
        }
        $ptype_plural = sanitize_title($plural);

        $labels = array(
            "name" => $plural,
            "singular_name" => $singular,
            "menu_name" => $plural,
            "name_admin_bar" => $singular,
            "archives" => sprintf(__("%s Archives", 'wphelper'), $singular),
            "attributes" => sprintf(__("%s Attributes", 'wphelper'), $singular),
            "parent_item_colon" => sprintf(__("Parent %s:", 'wphelper'), $singular),
            "all_items" => sprintf(__("All %s", 'wphelper'), $plural),
            "add_new" => sprintf(__("Add %s", 'wphelper'), $singular),
            "add_new_item" => sprintf(__("Add New %s", 'wphelper'), $singular),
            "new_item" => sprintf(__("New %s", 'wphelper'), $singular),
            "edit_item" => sprintf(__("Edit %s", 'wphelper'), $singular),
            "update_item" => sprintf(__("Update %s", 'wphelper'), $singular),
            "view_item" => sprintf(__("View %s", 'wphelper'), $singular),
            "view_items" => sprintf(__("View %s", 'wphelper'), $plural),
            "search_items" => sprintf(__("Search %s", 'wphelper'), $singular),
            "insert_into_item" => sprintf(__("Insert into %s", 'wphelper'), $singular),
            "uploaded_to_this_item" => sprintf(__("Uploaded to this %s", 'wphelper'), $singular),
            "items_list" => sprintf(__("%s list", 'wphelper'), $plural),
            "items_list_navigation" => sprintf(__("%s list navigation", 'wphelper'), $plural),
            "filter_items_list" => sprintf(__("Filter %s list", 'wphelper'), $plural)
        );
        $args = wp_parse_args((array) $arguments, array(
            'label' => $singular,
            'labels' => $labels,
            'description' => sprintf(__("Post Type for %s", 'wphelper'), $plural),
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'page-attributes'),
            'taxonomies' => [],
            'hierarchical' => false,
            'public' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'menu_position' => 5,
            'show_in_admin_bar' => true,
            'show_in_nav_menus' => true,
            'can_export' => true,
            'has_archive' => true,
            'exclude_from_search' => false,
            'publicly_queryable' => true,
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'show_in_rest' => true,
            'rest_base' => $ptype_plural,
            'rest_controller_class' => 'WP_REST_Posts_Controller',
        ));
        return register_post_type($ptype, $args);
    }

    /**
     * Add a new taxonomy
     *
     * @since     1.0.0
     * @param string $tax
     * @param boolean $singular
     * @param boolean $plural
     * @param boolean $ptypes
     * @param array $arguments
     * @return register_taxonomy() return
     */
    public function add_taxonomy($tax, $singular = false, $plural = false, $ptypes = false, $arguments = array()) {
        if (false === $singular) {
            $singular = ucfirst($tax);
        }
        if (false === $plural) {
            $plural = $singular . 's';
        }

        $labels = array(
            "name" => $plural,
            "singular_name" => $singular,
            "menu_name" => $plural,
            "all_items" => sprintf(__("All %s", 'wphelper'), $plural),
            "parent_item" => sprintf(__("Parent %s", 'wphelper'), $singular),
            "parent_item_colon" => sprintf(__("Parent %s:", 'wphelper'), $singular),
            "new_item_name" => sprintf(__("New %s Name", 'wphelper'), $singular),
            "add_new_item" => sprintf(__("Add New %s", 'wphelper'), $singular),
            "edit_item" => sprintf(__("Edit %s", 'wphelper'), $singular),
            "update_item" => sprintf(__("Update %s", 'wphelper'), $singular),
            "separate_items_with_commas" => sprintf(__("Separate multiple %s with commas", 'wphelper'), $plural),
            "search_items" => sprintf(__("Search %s", 'wphelper'), $plural),
            "add_or_remove_items" => sprintf(__("Add or remove %s", 'wphelper'), $plural),
            "choose_from_most_used" => sprintf(__("Choose from the most used %s", 'wphelper'), $plural)
        );
        $args = wp_parse_args((array) $arguments, array(
            'labels' => $labels,
            'hierarchical' => false,
            'public' => true,
            'show_ui' => true,
            'show_in_rest' => true,
            'rest_base' => $tax,
            'rest_controller_class' => 'WP_REST_Terms_Controller',
            'show_admin_column' => true,
            'show_in_nav_menus' => true,
            'show_tagcloud' => true
        ));
        register_taxonomy($tax, $ptypes, $args);
    }

    public function add_tab($id, $label, $content) {
        $this->tabs[$id] = compact("label", "content");
    }

    public function tabs_html() {
        if (empty($this->tabs)) {
            return;
        }
        $first_id = array_keys($this->tabs)[0];
        ?>
        <div class="tabs" data-tab="<?php print $first_id; ?>">
            <div class="tab-links">
            <?php foreach ($this->tabs as $id => $info) { ?>
                <a class="tab" href="#" data-tab="<?php print $id; ?>">
                    <?php print $info['label']; ?>
                </a>
            <?php } ?>
            </div>
            <div class="tab-stage">
            <?php foreach ($this->tabs as $id => $info) { ?>
                <div class="tab-content" data-tab="<?php print $id; ?>">
                    <?php
                        if (is_callable($info['content'])) {
                            print call_user_func($info['content']);
                        } else if (is_string($info['content'])) {
                            print $info['content'];
                        }
                    ?>
                </div>
            <?php } ?>
            </div>
        </div>
        <?php
        $this->tabs_css();
    }

    public function tabs_css() {
        if (!empty($this->tabs)) {
            $link_selector = [];
            $stage_selector = [];
            foreach (array_keys($this->tabs) as $id) {
                $link_selector[] = ".tabs[data-tab=\"{$id}\"] .tab-links a.tab[data-tab=\"{$id}\"]";
                $stage_selector[] = ".tabs[data-tab=\"{$id}\"] .tab-stage .tab-content[data-tab=\"{$id}\"]";
            }
        ?>
        <style>
            <?php print join(", ", $link_selector); ?> {
                background-color: #efefef;
                border-bottom-color: #efefef;
                font-weight: bold;
                cursor: default;
                padding-bottom: 0.5rem;
            }
            <?php print join(", ", $stage_selector); ?> {
                display: block;
            }
        </style>
        <?php
        }
    }



    /**
     * Exclui arquivos criados há mais de $limit dias no diretório $path.
     *
     * @param string $path Caminho do diretório a ser varrido.
     * @param int $limit Limite de idade dos arquivos, em dias.
     * @return int Number of deleted files
     */
    public function purge_temp($path, $limit = 1) {
        $deleted = 0;
        if (is_dir($path)) {
            $timeLimit = time() - ($limit * 86400);
            $files = scandir($path);
            foreach ($files as $file) {
                $filePath = $path . DIRECTORY_SEPARATOR . $file;
                if ($file === '.' || $file === '..') {
                    continue;
                }
                if (is_file($filePath)) {
                    $fileCreationTime = filemtime($filePath);
                    if ($fileCreationTime < $timeLimit) {
                        if (unlink($filePath)) {
                           $deleted++;
                        }
                    }
                }
            }
        }
        return $deleted;
    }

    // get permalink by title or slug and post type
    public function url_by_name($page_name, $post_type = 'page') {
        global $wpdb;
        $pid = $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE (post_title = '{$page_name}' OR post_name = '{$post_type}') AND post_type = '{$post_type}' AND post_status = 'publish' LIMIT 0, 1");
        if ($pid) {
            return get_permalink($pid);
        }
        return false;
    }
}

global $wp_helper;
$wp_helper = new WpHelper();
?>