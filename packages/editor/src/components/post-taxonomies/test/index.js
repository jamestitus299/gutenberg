/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PostTaxonomies } from '../';

describe( 'PostTaxonomies', () => {
	const genresTaxonomy = {
		name: 'Genres',
		slug: 'genre',
		types: [ 'book' ],
		hierarchical: true,
		rest_base: 'genres',
		visibility: {
			show_ui: true,
		},
		labels: {
			add_new_item: 'Add New Genre',
		},
	};

	const categoriesTaxonomy = {
		name: 'Categories',
		slug: 'category',
		types: [ 'post', 'page' ],
		hierarchical: true,
		rest_base: 'categories',
		visibility: {
			show_ui: true,
		},
		labels: {
			add_new_item: 'Add New Category',
		},
	};

	beforeEach( () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-create-categories': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/foo/create-categories',
					},
				],
				'wp:action-create-genres': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/create-genres',
					},
				],
				'wp:action-assign-categories': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/foo/assign-categories',
					},
				],
				'wp:action-assign-genres': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/assign-genres',
					},
				],
			},
		} );

		jest.spyOn( select( coreStore ), 'getTaxonomy' ).mockImplementation(
			( slug ) => {
				switch ( slug ) {
					case 'category': {
						return categoriesTaxonomy;
					}
					case 'genre': {
						return genresTaxonomy;
					}
				}
			}
		);
	} );

	it( 'should render no children if taxonomy data not available', () => {
		const taxonomies = null;

		const { container } = render(
			<PostTaxonomies postType="page" taxonomies={ taxonomies } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render taxonomy components for taxonomies assigned to post type', () => {
		const { rerender } = render(
			<PostTaxonomies
				postType="book"
				taxonomies={ [ genresTaxonomy, categoriesTaxonomy ] }
			/>
		);

		expect( screen.getByRole( 'group', { name: 'Genres' } ) ).toBeVisible();
		expect(
			screen.queryByRole( 'group', { name: 'Categories' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Add New Genre' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Add New Category' } )
		).not.toBeInTheDocument();

		rerender(
			<PostTaxonomies
				postType="book"
				taxonomies={ [
					genresTaxonomy,
					{
						...categoriesTaxonomy,
						types: [ 'post', 'page', 'book' ],
					},
				] }
			/>
		);

		expect( screen.getByRole( 'group', { name: 'Genres' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'group', { name: 'Categories' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add New Genre' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add New Category' } )
		).toBeVisible();
	} );

	it( 'should not render taxonomy components that hide their ui', () => {
		const { rerender } = render(
			<PostTaxonomies postType="book" taxonomies={ [ genresTaxonomy ] } />
		);

		expect( screen.getByRole( 'group', { name: 'Genres' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add New Genre' } )
		).toBeVisible();

		rerender(
			<PostTaxonomies
				postType="book"
				taxonomies={ [
					{
						...genresTaxonomy,
						visibility: { show_ui: false },
					},
				] }
			/>
		);

		expect(
			screen.queryByRole( 'group', { name: 'Genres' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Add New Genre' } )
		).not.toBeInTheDocument();
	} );
} );
