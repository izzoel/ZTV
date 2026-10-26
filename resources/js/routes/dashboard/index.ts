import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
export const cloudMedia = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cloudMedia.url(options),
    method: 'get',
})

cloudMedia.definition = {
    methods: ["get","head"],
    url: '/dashboard/cloud-media',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
cloudMedia.url = (options?: RouteQueryOptions) => {
    return cloudMedia.definition.url + queryParams(options)
}

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
cloudMedia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cloudMedia.url(options),
    method: 'get',
})

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
cloudMedia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cloudMedia.url(options),
    method: 'head',
})

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
const cloudMediaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cloudMedia.url(options),
    method: 'get',
})

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
cloudMediaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cloudMedia.url(options),
    method: 'get',
})

/**
* @see routes/web.php:974
* @route '/dashboard/cloud-media'
*/
cloudMediaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cloudMedia.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

cloudMedia.form = cloudMediaForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
export const databaseMedia = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: databaseMedia.url(options),
    method: 'get',
})

databaseMedia.definition = {
    methods: ["get","head"],
    url: '/dashboard/database-media',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
databaseMedia.url = (options?: RouteQueryOptions) => {
    return databaseMedia.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
databaseMedia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: databaseMedia.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
databaseMedia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: databaseMedia.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
const databaseMediaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: databaseMedia.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
databaseMediaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: databaseMedia.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard/database-media'
*/
databaseMediaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: databaseMedia.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

databaseMedia.form = databaseMediaForm

const dashboard = {
    cloudMedia: Object.assign(cloudMedia, cloudMedia),
    databaseMedia: Object.assign(databaseMedia, databaseMedia),
}

export default dashboard