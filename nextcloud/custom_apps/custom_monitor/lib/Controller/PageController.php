<?php

namespace OCA\Bookmarks\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

class PageController extends Controller {
    public function __construct(string $AppName, IRequest $request) {
        parent::__construct($AppName, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse {
        $response = new TemplateResponse('custom_monitor', 'main');

        $csp = new \OCP\AppFramework\Http\ContentSecurityPolicy();
        $response->setContentSecurityPolicy($csp);

        return $response;
    }
}