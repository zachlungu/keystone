import _ from 'lodash';
import React from 'react';
import Field from '../Field';
import { Checkbox, FormField, FormInput, FormNote, FormRow } from 'elemental';
import CollapsedFieldLabel from '../../components/CollapsedFieldLabel';
import NestedFormField from '../../components/NestedFormField';

/**
 * TODO:
 * - Remove dependency on underscore
 * - Custom path support
 */

module.exports = Field.create({

	displayName: 'LocationField',
	statics: {
		type: 'Location',
	},

	getInitialState () {
		return {
			collapsedFields: {},
			improve: false,
			overwrite: false,
		};
	},

	componentWillMount () {
		const { value = [] } = this.props;
		var collapsedFields = {};
		_.forEach(['number', 'name', 'street2', 'geo'], (i) => {
			if (!value[i]) {
				collapsedFields[i] = true;
			}
		}, this);
		this.setState({ collapsedFields });
	},

	shouldCollapse () {
		return this.props.collapse && !this.formatValue();
	},

	uncollapseFields () {
		this.setState({
			collapsedFields: {},
		});
	},

	fieldChanged (fieldPath, event) {
		const { value = {}, path, onChange } = this.props;
		onChange({
			path,
			value: {
				...value,
				[fieldPath]: event.target.value,
			},
		});
	},

	makeChanger (fieldPath) {
		return this.fieldChanged.bind(this, fieldPath);
	},

	geoChanged (i, event) {
		const { value = {}, path, onChange } = this.props;
		const newVal = event.target.value;
		const geo = [
			i === 0 ? newVal : value.geo ? value.geo[0] : '',
			i === 1 ? newVal : value.geo ? value.geo[1] : '',
		];
		onChange({
			path,
			value: {
				...value,
				geo,
			},
		});
	},

	makeGeoChanger (fieldPath) {
		return this.geoChanged.bind(this, fieldPath);
	},

	formatValue () {
		const { value = {} } = this.props;
		return _.compact([
			value.number,
			value.name,
			value.street1,
			value.street2,
			value.suburb,
			value.state,
			value.postcode,
			value.country,
		]).join(', ');
	},

	renderValue () {
		return <FormInput noedit>{this.formatValue() || '(no value)'}</FormInput>;
	},

	renderField (fieldPath, label, collapse, autofocus) {
		if (this.state.collapsedFields[fieldPath]) {
			return null;
		}
		const { value = {}, path } = this.props;
		return (
			<NestedFormField label={label}>
				<FormInput autofocus={autofocus} name={path + '.' + fieldPath} value={value[fieldPath]} onChange={this.makeChanger(fieldPath)} placeholder={label} />
			</NestedFormField>
		);
	},

	renderSuburbState () {
		const { value = {}, path } = this.props;
		return (
			<NestedFormField label="Suburb / State">
				<FormRow>
					<FormField width="two-thirds">
						<FormInput name={path + '.suburb'} value={value.suburb} onChange={this.makeChanger('suburb')} placeholder="Suburb" />
					</FormField>
					<FormField width="one-third">
						<FormInput name={path + '.state'} value={value.state} onChange={this.makeChanger('state')} placeholder="State" />
					</FormField>
				</FormRow>
			</NestedFormField>
		);
	},

	renderPostcodeCountry () {
		const { value = {}, path } = this.props;
		return (
			<NestedFormField label="Postcode / Country">
				<FormRow>
					<FormField width="one-third">
						<FormInput name={path + '.postcode'} value={value.postcode} onChange={this.makeChanger('postcode')} placeholder="Post Code" />
					</FormField>
					<FormField width="two-thirds">
						<FormInput name={path + '.country'} value={value.country} onChange={this.makeChanger('country')} placeholder="Country" />
					</FormField>
				</FormRow>
			</NestedFormField>
		);
	},

	renderGeo () {
		if (this.state.collapsedFields.geo) {
			return null;
		}
		const { value = {}, paths } = this.props;
		const geo = value.geo || [];
		return (
			<NestedFormField label="Lat / Lng">
				<FormRow>
					<FormField width="one-half">
						<FormInput name={paths.geo} value={geo[1]} onChange={this.makeGeoChanger(1)} placeholder="Latitude" />
					</FormField>
					<FormField width="one-half">
						<FormInput name={paths.geo} value={geo[0]} onChange={this.makeGeoChanger(0)} placeholder="Longitude" />
					</FormField>
				</FormRow>
			</NestedFormField>
		);
	},

	updateGoogleOption (key, e) {
		var newState = {};
		newState[key] = e.target.checked;
		this.setState(newState);
	},

	makeGoogler (key) {
		return this.updateGoogleOption.bind(this, key);
	},


	renderGoogleOptions () {
		const { paths, enableMapsAPI } = this.props;
		if (!enableMapsAPI) return null;
		var replace = this.state.improve ? (
			<Checkbox
				label="Replace existing data"
				name={paths.overwrite}
				onChange={this.makeGoogler('overwrite')}
				checked={this.state.overwrite} />
		) : null;
		return (
			<FormField offsetAbsentLabel>
				<Checkbox
					label="Autodetect and improve location on save"
					name={paths.improve}
					onChange={this.makeGoogler('improve')}
					checked={this.state.improve}
					title="When checked, this will attempt to fill missing fields. It will also get the lat/long" />
				{replace}
			</FormField>
		);
	},

	renderNote () {
		const { note } = this.props;
		if (!note) return null;
		return (
			<FormField offsetAbsentLabel>
				<FormNote note={note} />
			</FormField>
		);
	},

	renderUI () {

		if (!this.shouldRenderField()) {
			return (
				<FormField label={this.props.label}>{this.renderValue()}</FormField>
			);
		}

		/* eslint-disable no-script-url */
		var showMore = !_.isEmpty(this.state.collapsedFields)
			? <CollapsedFieldLabel onClick={this.uncollapseFields}>(show more fields)</CollapsedFieldLabel>
			: null;
		/* eslint-enable */

		const { label } = this.props;
		return (
			<div>
				<FormField label={label}>
					{showMore}
				</FormField>
				{this.renderField('number', 'PO Box / Shop', true, true)}
				{this.renderField('name', 'Building Name', true)}
				{this.renderField('street1', 'Street Address')}
				{this.renderField('street2', 'Street Address 2', true)}
				{this.renderSuburbState()}
				{this.renderPostcodeCountry()}
				{this.renderGeo()}
				{this.renderGoogleOptions()}
				{this.renderNote()}
			</div>
		);
	},

});
